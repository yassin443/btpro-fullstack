from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import date, timedelta
from .models import Cabinet, Abonnement, PlatformCharge, Annonce, ActivityLog, SystemError, PlanConfig, SiteSetting
from users.models import User

PLAN_PRICES = {'SOLO': 4900, 'CABINET': 8900, 'AGENCE': 14900}


def get_plan_prices():
    """Tarifs depuis PlanConfig (BDD) avec repli sur PLAN_PRICES."""
    try:
        d = {p.code: float(p.prix) for p in PlanConfig.objects.all()}
        if d:
            return d
    except Exception:
        pass
    return PLAN_PRICES
_PLAT_CAT_LABEL = dict(PlatformCharge.CATEGORIES)            # code -> label
_PLAT_CAT_BY_LABEL = {v: k for k, v in PlatformCharge.CATEGORIES}  # label -> code


def _charge_dict(c):
    return {
        'id': c.id,
        'categorie': c.categorie,
        'categorie_label': c.get_categorie_display(),
        'libelle': c.libelle,
        'montant': float(c.montant),
        'date': c.date.isoformat() if c.date else None,
        'recurrent': c.recurrent,
    }


def _superadmin_only(request):
    return request.user.is_authenticated and request.user.is_superuser


def _client_ip(request):
    fwd = request.META.get('HTTP_X_FORWARDED_FOR')
    return (fwd.split(',')[0].strip() if fwd else request.META.get('REMOTE_ADDR', '')) or ''


def log_action(request, action, cible=''):
    """Enregistre une action superadmin dans la piste d'audit (best-effort)."""
    try:
        ActivityLog.objects.create(
            user_email=getattr(request.user, 'email', '') or '',
            action=action, cible=cible, ip=_client_ip(request),
        )
    except Exception:
        pass


def record_error(message, source='', niveau='Error', contexte=''):
    """Enregistre/incrémente un incident technique (utilisable partout dans le code)."""
    try:
        existing = SystemError.objects.filter(niveau=niveau, message=message[:300], source=source).first()
        if existing:
            existing.occurrences += 1
            if contexte:
                existing.contexte = contexte
            existing.save(update_fields=['occurrences', 'contexte', 'updated_at'])
            return existing
        return SystemError.objects.create(niveau=niveau, message=message[:300], source=source, contexte=contexte)
    except Exception:
        return None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    if not _superadmin_only(request):
        return Response({'error': 'Accès refusé'}, status=403)

    cabinets = (
        Cabinet.objects
        .select_related('abonnement')
        .prefetch_related('membres')
        .order_by('-date_creation')
    )

    today = timezone.now().date()
    total_cabinets = cabinets.count()
    total_users = User.objects.exclude(is_superuser=True).count()

    prices = get_plan_prices()
    actifs = 0
    ca_mensuel = 0
    churn_risk = 0
    plans_count = {'SOLO': 0, 'CABINET': 0, 'AGENCE': 0}
    cabinet_list = []

    # Nouveaux ce mois-ci
    debut_mois = today.replace(day=1)
    nouveaux_mois = cabinets.filter(date_creation__gte=debut_mois).count()

    for c in cabinets:
        abo = getattr(c, 'abonnement', None)
        plan = abo.plan if abo else 'SOLO'
        is_actif = abo.actif if abo else False
        date_fin = abo.date_fin if abo else None

        expiration_proche = False
        if is_actif and date_fin:
            jours_restants = (date_fin - today).days
            if jours_restants <= 30:
                churn_risk += 1
                expiration_proche = True

        if is_actif:
            actifs += 1
            ca_mensuel += prices.get(plan, 0)
            plans_count[plan] = plans_count.get(plan, 0) + 1

        patron = c.membres.filter(is_patron=True).first()
        cabinet_list.append({
            'id': c.id,
            'nom': c.nom,
            'email': c.email or (patron.email if patron else ''),
            'telephone': c.telephone,
            'date_creation': c.date_creation,
            'plan': plan,
            'actif': is_actif,
            'date_debut': abo.date_debut if abo else None,
            'date_fin': date_fin,
            'expiration_proche': expiration_proche,
            'nb_utilisateurs': c.membres.count(),
            'patron_email': patron.email if patron else '',
            'wilaya': c.wilaya,
        })

    # Répartition par plan (pour les cartes du tableau de bord)
    _accents = {
        'SOLO': ('#1100FF', 'bg-brand'),
        'CABINET': ('#1F8A5B', 'bg-emerald-500'),
        'AGENCE': ('#7A5BFF', 'bg-violet-500'),
    }
    plan_breakdown = [{
        'id': code.lower(), 'name': code,
        'count': plans_count.get(code, 0),
        'price': prices.get(code, 0),
        'accent': _accents[code][0], 'bar': _accents[code][1],
    } for code in ['SOLO', 'CABINET', 'AGENCE']]

    # Évolution du MRR sur 8 mois (MRR des abonnements actifs créés à la date du mois)
    _abbr = ['', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    revenue_trend = []
    for i in range(7, -1, -1):
        y, m = today.year, today.month - i
        while m <= 0:
            m += 12
            y -= 1
        end = (date(y + (1 if m == 12 else 0), 1 if m == 12 else m + 1, 1)) - timedelta(days=1)
        mrr_m = sum(prices.get(c['plan'], 0) for c in cabinet_list
                    if c['actif'] and c['date_debut'] and c['date_debut'] <= end)
        revenue_trend.append({'m': _abbr[m], 'v': mrr_m})

    return Response({
        'stats': {
            'total_cabinets': total_cabinets,
            'cabinets_actifs': actifs,
            'total_utilisateurs': total_users,
            'ca_mensuel': ca_mensuel,
            'arr': ca_mensuel * 12,
            'churn_risk': churn_risk,
            'nouveaux_mois': nouveaux_mois,
            'plans': plans_count,
        },
        'plan_breakdown': plan_breakdown,
        'revenue_trend': revenue_trend,
        'cabinets': cabinet_list,
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def toggle_cabinet(request, pk):
    if not _superadmin_only(request):
        return Response({'error': 'Accès refusé'}, status=403)
    try:
        abo = Abonnement.objects.get(cabinet_id=pk)
        abo.actif = not abo.actif
        abo.save()
        log_action(request, 'A activé un cabinet' if abo.actif else 'A désactivé un cabinet', f'cabinet #{pk}')
        return Response({'actif': abo.actif})
    except Abonnement.DoesNotExist:
        return Response({'error': 'Cabinet introuvable'}, status=404)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_plan(request, pk):
    if not _superadmin_only(request):
        return Response({'error': 'Accès refusé'}, status=403)
    plan = request.data.get('plan')
    if plan not in PLAN_PRICES:
        return Response({'error': 'Plan invalide'}, status=400)
    try:
        abo = Abonnement.objects.get(cabinet_id=pk)
        abo.plan = plan
        abo.save()
        log_action(request, f'A changé le plan → {plan}', f'cabinet #{pk}')
        return Response({'plan': abo.plan})
    except Abonnement.DoesNotExist:
        return Response({'error': 'Cabinet introuvable'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cabinet_membres(request, pk):
    if not _superadmin_only(request):
        return Response({'error': 'Accès refusé'}, status=403)
    membres = User.objects.filter(cabinet_id=pk).values(
        'id', 'email', 'prenom', 'nom', 'role', 'is_patron', 'is_active'
    )
    return Response(list(membres))


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_cabinet(request, pk):
    if not _superadmin_only(request):
        return Response({'error': 'Accès refusé'}, status=403)
    try:
        cabinet = Cabinet.objects.get(pk=pk)
        nom = cabinet.nom
        cabinet.delete()
        log_action(request, 'A supprimé un cabinet', f'{nom} (#{pk})')
        return Response({'success': True})
    except Cabinet.DoesNotExist:
        return Response({'error': 'Cabinet introuvable'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def contact_messages(request):
    if not _superadmin_only(request):
        return Response({'error': 'Accès refusé'}, status=403)
    from .models import ContactMessage
    msgs = ContactMessage.objects.order_by('-created_at')[:200]
    return Response([{
        'id': m.id,
        'nom': m.nom,
        'cabinet': m.cabinet,
        'email': m.email,
        'telephone': m.telephone,
        'sujet': m.sujet,
        'sujet_label': m.get_sujet_display(),
        'message': m.message,
        'lu': m.lu,
        'repondu': m.repondu,
        'reponse': m.reponse,
        'created_at': m.created_at,
    } for m in msgs])


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def contact_message_lu(request, pk):
    if not _superadmin_only(request):
        return Response({'error': 'Accès refusé'}, status=403)
    from .models import ContactMessage
    try:
        msg = ContactMessage.objects.get(pk=pk)
        msg.lu = True
        msg.save()
        return Response({'lu': True})
    except ContactMessage.DoesNotExist:
        return Response({'error': 'Message introuvable'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def contact_message_repondre(request, pk):
    if not _superadmin_only(request):
        return Response({'error': 'Accès refusé'}, status=403)
    from .models import ContactMessage
    reponse = (request.data.get('message') or '').strip()
    if not reponse:
        return Response({'error': 'Réponse vide'}, status=400)
    try:
        msg = ContactMessage.objects.get(pk=pk)
    except ContactMessage.DoesNotExist:
        return Response({'error': 'Message introuvable'}, status=404)

    msg.reponse = reponse
    msg.repondu = True
    msg.repondu_at = timezone.now()
    msg.lu = True
    msg.save()

    # Envoi email — backend console en dev ; SMTP/Resend branché en T3 (best-effort)
    try:
        from django.conf import settings
        from django.core.mail import send_mail
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or 'noreply@planner.dz'
        send_mail(
            subject=f"Re: {msg.get_sujet_display()} — Planner",
            message=reponse,
            from_email=from_email,
            recipient_list=[msg.email],
            fail_silently=True,
        )
    except Exception:
        pass

    log_action(request, 'A répondu à un message', msg.email)
    return Response({'success': True, 'repondu': True, 'repondu_at': msg.repondu_at})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def prolonger(request, pk):
    if not _superadmin_only(request):
        return Response({'error': 'Accès refusé'}, status=403)
    mois = int(request.data.get('mois', 1))
    if mois < 1 or mois > 24:
        return Response({'error': 'Durée invalide'}, status=400)
    try:
        abo = Abonnement.objects.get(cabinet_id=pk)
        today = timezone.now().date()
        base = abo.date_fin if (abo.date_fin and abo.date_fin > today) else today
        abo.date_fin = base + timedelta(days=30 * mois)
        abo.actif = True
        abo.save()
        log_action(request, f"A prolongé l'abonnement (+{mois} mois)", f'cabinet #{pk}')
        return Response({'date_fin': abo.date_fin, 'actif': abo.actif})
    except Abonnement.DoesNotExist:
        return Response({'error': 'Cabinet introuvable'}, status=404)


# ── Données métier (lecture seule, tous cabinets) ──────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_projets(request):
    if not _superadmin_only(request):
        return Response({'error': 'Accès refusé'}, status=403)
    from projets.models import Projet
    qs = Projet.objects.select_related('cabinet', 'client').order_by('-date_creation')[:1000]
    return Response([{
        'id': p.id,
        'cabinet': p.cabinet.nom if p.cabinet_id else '',
        'projet': p.nom,
        'type': p.get_type_projet_display(),
        'statut': p.get_statut_display(),
        'date': p.date_creation.date().isoformat() if p.date_creation else None,
        'honoraires': float(p.honoraires_total or 0),
    } for p in qs])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_factures(request):
    if not _superadmin_only(request):
        return Response({'error': 'Accès refusé'}, status=403)
    from finances.models import Facture
    qs = Facture.objects.select_related('cabinet', 'client').order_by('-id')[:1000]
    return Response([{
        'num': f.numero,
        'cabinet': f.cabinet.nom if f.cabinet_id else '',
        'client': f.client.nom if f.client_id else '',
        'montant': float(f.montant_ttc or 0),
        'statut': f.get_statut_display(),
        'echeance': f.date_echeance.isoformat() if f.date_echeance else None,
    } for f in qs])


# ── Finances plateforme (revenus vs charges / P&L) ─────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def charges_plateforme(request):
    if not _superadmin_only(request):
        return Response({'error': 'Accès refusé'}, status=403)

    if request.method == 'POST':
        data = request.data
        cat = data.get('categorie', 'AUTRE')
        if cat not in _PLAT_CAT_LABEL:
            cat = _PLAT_CAT_BY_LABEL.get(cat, 'AUTRE')
        libelle = (data.get('libelle') or '').strip()
        try:
            montant = float(data.get('montant') or 0)
        except (TypeError, ValueError):
            montant = 0
        if not libelle or montant <= 0:
            return Response({'error': 'Libellé et montant valides requis'}, status=400)
        date = data.get('date') or timezone.now().date()
        c = PlatformCharge.objects.create(
            categorie=cat, libelle=libelle, montant=montant,
            recurrent=bool(data.get('recurrent', True)), date=date,
        )
        log_action(request, 'A ajouté une charge plateforme', f'{c.get_categorie_display()} — {c.montant} DA')
        return Response(_charge_dict(c), status=201)

    charges = list(PlatformCharge.objects.all())
    total = sum(float(c.montant) for c in charges)
    prices = get_plan_prices()
    mrr = sum(prices.get(a.plan, 0) for a in Abonnement.objects.filter(actif=True))
    benefice = mrr - total
    marge = round((benefice / mrr) * 100) if mrr else 0

    par_cat = {}
    for c in charges:
        par_cat[c.categorie] = par_cat.get(c.categorie, 0) + float(c.montant)
    par_categorie = [
        {'categorie': _PLAT_CAT_LABEL.get(k, k), 'total': v}
        for k, v in sorted(par_cat.items(), key=lambda x: -x[1])
    ]

    return Response({
        'revenus': mrr,
        'charges': total,
        'benefice': benefice,
        'marge': marge,
        'par_categorie': par_categorie,
        'liste': [_charge_dict(c) for c in charges],
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def charge_plateforme_detail(request, pk):
    if not _superadmin_only(request):
        return Response({'error': 'Accès refusé'}, status=403)
    try:
        PlatformCharge.objects.get(pk=pk).delete()
        log_action(request, 'A supprimé une charge plateforme', f'#{pk}')
        return Response({'success': True})
    except PlatformCharge.DoesNotExist:
        return Response({'error': 'Charge introuvable'}, status=404)


# ── Annonces (diffusion) ───────────────────────────────────────────

_CANAL_BY_LABEL = {v: k for k, v in Annonce.CANALS}
_CIBLE_BY_LABEL = {v: k for k, v in Annonce.CIBLES}


def _annonce_dict(a):
    return {
        'id': a.id,
        'titre': a.titre,
        'canal': a.get_canal_display(),
        'cible': a.get_cible_display(),
        'dest': a.destinataires,
        'date': a.created_at.date().isoformat() if a.created_at else None,
    }


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def annonces(request):
    if not _superadmin_only(request):
        return Response({'error': 'Accès refusé'}, status=403)

    if request.method == 'POST':
        data = request.data
        titre = (data.get('titre') or '').strip()
        message = (data.get('message') or '').strip()
        if not titre or not message:
            return Response({'error': 'Titre et message requis'}, status=400)
        canal = data.get('canal', 'LES_DEUX')
        if canal not in dict(Annonce.CANALS):
            canal = _CANAL_BY_LABEL.get(canal, 'LES_DEUX')
        cible = data.get('cible', 'TOUS')
        if cible not in dict(Annonce.CIBLES):
            cible = _CIBLE_BY_LABEL.get(cible, 'TOUS')

        # destinataires ciblés (cabinets non-superadmin)
        users = User.objects.filter(is_superuser=False, cabinet__isnull=False).select_related('cabinet')
        if cible != 'TOUS':
            users = users.filter(cabinet__abonnement__plan=cible)
        users = list(users)

        # fan-out in-app (si canal inclut In-app)
        if canal in ('INAPP', 'LES_DEUX'):
            from projets.models import Notification
            txt = f"{titre} — {message}"[:300]
            Notification.objects.bulk_create([
                Notification(cabinet=u.cabinet, destinataire=u, message=txt, lien='/dashboard')
                for u in users
            ])
        # canal Email / Les deux : l'envoi email réel sera branché en T3 (Resend)

        a = Annonce.objects.create(
            titre=titre, message=message, canal=canal, cible=cible,
            destinataires=len(users), sent_by=request.user,
        )
        log_action(request, 'A envoyé une annonce', f'{a.get_cible_display()} ({a.destinataires} dest.)')
        return Response(_annonce_dict(a), status=201)

    return Response([_annonce_dict(a) for a in Annonce.objects.all()[:100]])


# ── Logs d'activité & erreurs système ──────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def logs(request):
    if not _superadmin_only(request):
        return Response({'error': 'Accès refusé'}, status=403)
    return Response([{
        'user': l.user_email,
        'action': l.action,
        'cible': l.cible,
        'date': l.created_at.strftime('%Y-%m-%d %H:%M') if l.created_at else '',
        'ip': l.ip,
    } for l in ActivityLog.objects.all()[:200]])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def erreurs(request):
    if not _superadmin_only(request):
        return Response({'error': 'Accès refusé'}, status=403)
    return Response([{
        'id': e.id,
        'niveau': e.niveau,
        'message': e.message,
        'source': e.source,
        'date': e.updated_at.strftime('%Y-%m-%d %H:%M') if e.updated_at else '',
        'occ': e.occurrences,
        'ctx': e.contexte,
    } for e in SystemError.objects.all()[:200]])


# ── Configuration : plans, limites, paramètres ─────────────────────

def _plan_pricing_dict(p):
    return {'id': p.id, 'code': p.code, 'name': p.name, 'prix': float(p.prix),
            'annuel': float(p.annuel), 'populaire': p.populaire, 'features': p.features}


def _plan_limits_dict(p):
    return {'code': p.code, 'plan': p.name, 'projets': p.max_projets, 'users': p.max_users,
            'stockage': p.stockage_gb, 'planning': p.f_planning, 'soustraitants': p.f_soustraitants,
            'exportCompta': p.f_export_compta, 'ia': p.f_ia}


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def plans_config(request):
    if not _superadmin_only(request):
        return Response({'error': 'Accès refusé'}, status=403)
    if request.method == 'PUT':
        items = request.data if isinstance(request.data, list) else request.data.get('plans', [])
        for it in items:
            p = PlanConfig.objects.filter(code=it.get('code')).first()
            if not p:
                continue
            if 'prix' in it:
                try: p.prix = float(it['prix'] or 0)
                except (TypeError, ValueError): pass
            if 'annuel' in it:
                try: p.annuel = float(it['annuel'] or 0)
                except (TypeError, ValueError): pass
            if 'populaire' in it:
                p.populaire = bool(it['populaire'])
            if isinstance(it.get('features'), list):
                p.features = it['features']
            p.save()
        log_action(request, 'A modifié les plans tarifaires')
    return Response([_plan_pricing_dict(p) for p in PlanConfig.objects.all()])


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def limites_config(request):
    if not _superadmin_only(request):
        return Response({'error': 'Accès refusé'}, status=403)
    if request.method == 'PUT':
        items = request.data if isinstance(request.data, list) else request.data.get('limites', [])
        for it in items:
            key = it.get('code') or it.get('plan')
            p = PlanConfig.objects.filter(code=key).first() or PlanConfig.objects.filter(name=key).first()
            if not p:
                continue
            for src, field in [('users', 'max_users'), ('projets', 'max_projets'), ('stockage', 'stockage_gb')]:
                if src in it and it[src] not in (None, '', '∞'):
                    try: setattr(p, field, int(it[src]))
                    except (TypeError, ValueError): pass
            for src, field in [('planning', 'f_planning'), ('soustraitants', 'f_soustraitants'), ('exportCompta', 'f_export_compta'), ('ia', 'f_ia')]:
                if src in it:
                    setattr(p, field, bool(it[src]))
            p.save()
        log_action(request, 'A modifié les limites par plan')
    return Response([_plan_limits_dict(p) for p in PlanConfig.objects.all()])


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def parametres(request):
    if not _superadmin_only(request):
        return Response({'error': 'Accès refusé'}, status=403)
    s = SiteSetting.load()
    if request.method == 'PUT':
        data = request.data
        if 'nom' in data: s.nom = data['nom']
        if 'email' in data: s.email_contact = data['email']
        if 'devise' in data: s.devise = data['devise']
        if 'tva' in data:
            try: s.tva_defaut = float(data['tva'])
            except (TypeError, ValueError): pass
        if 'maintenance' in data: s.maintenance = bool(data['maintenance'])
        if 'inscriptions' in data: s.inscriptions_ouvertes = bool(data['inscriptions'])
        s.save()
        log_action(request, 'A modifié les paramètres généraux')
    return Response({
        'nom': s.nom, 'email': s.email_contact, 'devise': s.devise,
        'tva': float(s.tva_defaut), 'maintenance': s.maintenance, 'inscriptions': s.inscriptions_ouvertes,
    })


# ── Statistiques IA ────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ia_stats(request):
    if not _superadmin_only(request):
        return Response({'error': 'Accès refusé'}, status=403)
    from ia.models import IAUsage
    from django.db.models import Count

    qs = IAUsage.objects.all()
    total = qs.count()

    OUTILS = {'cctp': 'CCTP', 'cr': 'Compte-rendu', 'reglementation': 'Réglementation'}
    by_tool = dict(qs.values_list('outil').annotate(c=Count('id')))
    tools = [{'name': label, 'value': by_tool.get(code, 0)} for code, label in OUTILS.items()]

    top = qs.values('cabinet__nom').annotate(c=Count('id')).order_by('-c')[:5]
    top_cabinets = [{'nom': t['cabinet__nom'] or '—', 'value': t['c']} for t in top]

    # 12 derniers mois
    today = timezone.now().date()
    months = []
    for i in range(11, -1, -1):
        y, m = today.year, today.month - i
        while m <= 0:
            m += 12
            y -= 1
        months.append((y, m))
    counts = {k: 0 for k in months}
    for u in qs.only('created_at'):
        key = (u.created_at.year, u.created_at.month)
        if key in counts:
            counts[key] += 1
    over_time = [counts[k] for k in months]

    return Response({
        'total': total,
        'tools': tools,
        'topCabinets': top_cabinets,
        'overTime': over_time,
    })
