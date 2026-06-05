from decimal import Decimal
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, Q, F, ExpressionWrapper, DecimalField, Prefetch
from django.utils import timezone
from datetime import timedelta
from .models import Client, Projet, Phase, Tache, FeuilleDeTemps, SousTraitant, PermisConstruction, BudgetPoste, CompteRendu, Notification
from .serializers import (
    ClientSerializer, ProjetSerializer, PhaseSerializer, TacheSerializer,
    FeuilleDeTempsSerializer, SousTraitantSerializer,
    PermisConstructionSerializer, BudgetPosteSerializer, CompteRenduSerializer,
)
from cabinets.permissions import peut_ajouter_projet


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def clients(request):
    cabinet = request.user.cabinet
    if request.method == 'GET':
        data = Client.objects.filter(cabinet=cabinet)
        return Response(ClientSerializer(data, many=True).data)
    serializer = ClientSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(cabinet=cabinet)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def client_detail(request, pk):
    try:
        client = Client.objects.get(pk=pk, cabinet=request.user.cabinet)
    except Client.DoesNotExist:
        return Response({'error': 'Client introuvable'}, status=404)
    if request.method == 'GET':
        return Response(ClientSerializer(client).data)
    if request.method == 'PUT':
        serializer = ClientSerializer(client, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    client.delete()
    return Response(status=204)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def projets(request):
    cabinet = request.user.cabinet
    if request.method == 'GET':
        data = Projet.objects.filter(cabinet=cabinet).select_related('client')
        return Response(ProjetSerializer(data, many=True).data)

    if not peut_ajouter_projet(request.user):
        return Response({
            'error': 'Limite atteinte.',
            'upgrade': True,
            'message': 'Limite de 5 projets atteinte. Passez au plan Cabinet pour des projets illimités.'
        }, status=403)

    serializer = ProjetSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(cabinet=cabinet)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def projet_detail(request, pk):
    try:
        projet = Projet.objects.select_related('client').get(pk=pk, cabinet=request.user.cabinet)
    except Projet.DoesNotExist:
        return Response({'error': 'Projet introuvable'}, status=404)
    if request.method == 'GET':
        phases = projet.phases.all()
        if phases.exists() and not phases.filter(complete=False).exists() and projet.statut != 'TERMINE':
            projet.statut = 'TERMINE'
            projet.save(update_fields=['statut'])
        return Response(ProjetSerializer(projet).data)
    if request.method == 'PUT':
        serializer = ProjetSerializer(projet, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    projet.delete()
    return Response(status=204)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def phases(request, projet_pk):
    try:
        projet = Projet.objects.get(pk=projet_pk, cabinet=request.user.cabinet)
    except Projet.DoesNotExist:
        return Response({'error': 'Projet introuvable'}, status=404)
    if request.method == 'GET':
        return Response(PhaseSerializer(projet.phases.all(), many=True).data)
    serializer = PhaseSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(projet=projet)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def feuilles_de_temps(request):
    cabinet = request.user.cabinet
    if request.method == 'GET':
        qs = FeuilleDeTemps.objects.filter(projet__cabinet=cabinet).select_related('user', 'projet')
        if not request.user.is_patron:
            qs = qs.filter(user=request.user)
        return Response(FeuilleDeTempsSerializer(qs, many=True).data)
    user_id = request.data.get('user')
    target_user = request.user
    if user_id and request.user.is_patron:
        from users.models import User
        try:
            target_user = User.objects.get(pk=int(user_id), cabinet=request.user.cabinet)
        except (User.DoesNotExist, ValueError):
            target_user = request.user

    # Enforce remuneration type rules for non-patron members
    save_kwargs = {'user': target_user}
    if not target_user.is_patron:
        try:
            cfg = target_user.config_paie
            type_paie = cfg.type_paie
            taux_paie = cfg.taux
        except Exception:
            type_paie = None
            taux_paie = 0

        if type_paie == 'MENSUEL':
            return Response(
                {'error': f'{target_user.prenom} est en mensuel fixe — pas de feuilles de temps.'},
                status=400
            )
        if type_paie == 'JOURNALIER' and not request.data.get('taux_horaire'):
            save_kwargs['taux_horaire'] = taux_paie

    serializer = FeuilleDeTempsSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(**save_kwargs)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stats_temps(request):
    cabinet = request.user.cabinet
    feuilles = FeuilleDeTemps.objects.filter(projet__cabinet=cabinet)

    totaux = feuilles.aggregate(
        total_heures=Sum('heures'),
        heures_facturables=Sum('heures', filter=Q(facturable=True)),
    )

    montant_total = (
        feuilles.filter(facturable=True)
        .annotate(montant=ExpressionWrapper(
            F('heures') * F('taux_horaire'),
            output_field=DecimalField(max_digits=15, decimal_places=2)
        ))
        .aggregate(total=Sum('montant'))['total'] or 0
    )

    return Response({
        'total_heures': str(totaux['total_heures'] or 0),
        'heures_facturables': str(totaux['heures_facturables'] or 0),
        'montant_total': str(montant_total),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def planning_equipe(request):
    from users.models import User

    cabinet = request.user.cabinet
    # Include all cabinet members + the patron (in case cabinet FK is null on their record)
    membres = User.objects.filter(cabinet=cabinet) | User.objects.filter(pk=request.user.pk)
    membres = membres.distinct()

    heures_par_membre   = {}
    heures_total_membre = {}
    for row in (
        FeuilleDeTemps.objects
        .filter(projet__cabinet=cabinet)
        .values('user_id', 'projet__nom')
        .annotate(total=Sum('heures'))
        .order_by('user_id', '-total')
    ):
        uid = row['user_id']
        heures_par_membre.setdefault(uid, []).append({
            'projet': row['projet__nom'],
            'heures': str(row['total']),
        })
        heures_total_membre[uid] = heures_total_membre.get(uid, 0) + float(row['total'])

    data = []
    for m in membres:
        heures = heures_total_membre.get(m.id, 0)
        if heures == 0:
            statut = 'DISPONIBLE'
        elif heures <= 120:
            statut = 'OCCUPE'
        else:
            statut = 'SURCHARGE'

        data.append({
            'id': m.id,
            'nom': m.prenom + ' ' + m.nom,
            'role': m.role,
            'heures_total': str(round(heures, 2)),
            'heures_par_projet': heures_par_membre.get(m.id, []),
            'statut': statut,
        })

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def rentabilite(request):
    from finances.models import Charge, Devis, Facture, ConfigPaie
    from django.db.models import Q, Sum
    import datetime

    cabinet = request.user.cabinet
    mode = request.query_params.get('mode', 'projet')  # projet | mensuel | annuel
    mois = request.query_params.get('mois')
    annee = request.query_params.get('annee')

    # Taux journalier effectif par membre (taux_horaire=0 pour les journaliers)
    journalier_taux = {
        cfg.membre_id: float(cfg.taux)
        for cfg in ConfigPaie.objects.filter(membre__cabinet=cabinet, type_paie='JOURNALIER')
    }

    def cout_feuille(f):
        taux = float(f.taux_horaire) if float(f.taux_horaire) > 0 else journalier_taux.get(f.user_id, 0)
        return float(f.heures) * taux

    # ── Mode période (mensuel ou annuel) ──────────────────────────────────────
    if mode in ('mensuel', 'annuel') and annee:
        annee = int(annee)
        mois = int(mois) if mois else None

        if mode == 'mensuel' and mois:
            date_debut = datetime.date(annee, mois, 1)
            import calendar
            date_fin = datetime.date(annee, mois, calendar.monthrange(annee, mois)[1])
        else:
            date_debut = datetime.date(annee, 1, 1)
            date_fin = datetime.date(annee, 12, 31)

        # Revenus = devis acceptés émis dans la période
        revenus = float(
            Devis.objects.filter(cabinet=cabinet, statut='ACCEPTE', date_emission__range=(date_debut, date_fin))
            .aggregate(t=Sum('montant_ttc'))['t'] or 0
        )

        # Charges directes dans la période (hors salaires)
        charges_directes = float(
            Charge.objects.filter(cabinet=cabinet, date__range=(date_debut, date_fin))
            .exclude(categorie='SALAIRE')
            .aggregate(t=Sum('montant'))['t'] or 0
        )

        # Salaires fixes MENSUEL dans la période
        masse_salariale = float(
            Charge.objects.filter(cabinet=cabinet, categorie='SALAIRE', date__range=(date_debut, date_fin))
            .aggregate(t=Sum('montant'))['t'] or 0
        )

        # Coût heures dans la période (journaliers au taux réel ConfigPaie)
        feuilles_periode = list(FeuilleDeTemps.objects.filter(
            projet__cabinet=cabinet, date__range=(date_debut, date_fin)
        ))
        cout_heures = sum(cout_feuille(f) for f in feuilles_periode)
        heures_total = float(sum(f.heures for f in feuilles_periode))

        # Sous-traitants actifs dans la période
        sous_traitants_periode = float(
            SousTraitant.objects.filter(cabinet=cabinet, date_debut__lte=date_fin)
            .filter(Q(date_fin__isnull=True) | Q(date_fin__gte=date_debut))
            .aggregate(t=Sum('montant'))['t'] or 0
        )

        total_cout = charges_directes + masse_salariale + cout_heures + sous_traitants_periode
        profit = revenus - total_cout

        # Détail par projet pour la période
        projets_data = []
        for p in Projet.objects.filter(cabinet=cabinet).exclude(statut='ANNULE'):
            p_revenus = float(
                Devis.objects.filter(cabinet=cabinet, projet=p, statut='ACCEPTE', date_emission__range=(date_debut, date_fin))
                .aggregate(t=Sum('montant_ttc'))['t'] or 0
            )
            p_charges = float(
                Charge.objects.filter(cabinet=cabinet, projet=p, date__range=(date_debut, date_fin))
                .aggregate(t=Sum('montant'))['t'] or 0
            )
            p_feuilles = FeuilleDeTemps.objects.filter(projet=p, date__range=(date_debut, date_fin))
            p_cout_heures = sum(cout_feuille(f) for f in p_feuilles)
            p_cout = p_charges + p_cout_heures
            p_profit = p_revenus - p_cout
            p_marge = (p_profit / p_revenus * 100) if p_revenus > 0 else 0
            if p_revenus > 0 or p_cout > 0:
                projets_data.append({
                    'id': p.id, 'nom': p.nom, 'statut': p.statut,
                    'honoraires': str(p_revenus),
                    'charges': str(p_charges),
                    'cout_heures': str(p_cout_heures),
                    'cout_total': str(p_cout),
                    'profit': str(p_profit),
                    'marge': round(float(p_marge), 1),
                })

        return Response({
            'mode': mode,
            'periode': {'mois': mois, 'annee': annee, 'date_debut': str(date_debut), 'date_fin': str(date_fin)},
            'projets': projets_data,
            'total_honoraires': str(revenus),
            'charges_directes': str(charges_directes),
            'masse_salariale': str(masse_salariale),
            'cout_heures': str(cout_heures),
            'heures_total': str(heures_total),
            'sous_traitants': str(sous_traitants_periode),
            'total_cout': str(total_cout),
            'total_profit': str(profit),
        })

    # ── Mode projet (all-time par projet) ─────────────────────────────────────
    projets_list = Projet.objects.filter(cabinet=cabinet).exclude(statut='ANNULE').prefetch_related(
        Prefetch('feuilles', queryset=FeuilleDeTemps.objects.all()),
        Prefetch('charges', queryset=Charge.objects.all()),
        Prefetch('sous_traitants', queryset=SousTraitant.objects.all()),
    )

    devis_acceptes = {
        d.projet_id: d.montant_ttc
        for d in Devis.objects.filter(cabinet=cabinet, statut='ACCEPTE').order_by('projet_id', '-date_emission')
    }

    data = []
    for p in projets_list:
        feuilles = p.feuilles.all()
        heures_total = float(sum(f.heures for f in feuilles))
        cout_heures = sum(cout_feuille(f) for f in feuilles)
        total_charges = sum(c.montant for c in p.charges.all())
        total_sous_traitants = sum(s.montant for s in p.sous_traitants.all())
        cout_total = float(total_charges + total_sous_traitants) + cout_heures
        honoraires = float(devis_acceptes.get(p.id, p.honoraires_total or 0))
        profit = honoraires - cout_total
        marge = (profit / honoraires * 100) if honoraires > 0 else 0

        data.append({
            'id': p.id, 'nom': p.nom, 'statut': p.statut,
            'honoraires': str(honoraires),
            'heures_total': str(heures_total),
            'cout_heures': str(cout_heures),
            'charges': str(float(total_charges)),
            'sous_traitants': str(float(total_sous_traitants)),
            'cout_total': str(cout_total),
            'profit': str(profit),
            'marge': round(float(marge), 1),
        })

    total_honoraires = sum(float(d['honoraires']) for d in data)
    total_cout_projets = sum(float(d['cout_total']) for d in data)
    masse_salariale = float(
        Charge.objects.filter(cabinet=cabinet, categorie='SALAIRE', projet=None).aggregate(t=Sum('montant'))['t'] or 0
    )
    total_cout = total_cout_projets + masse_salariale
    total_profit = total_honoraires - total_cout

    return Response({
        'mode': 'projet',
        'projets': data,
        'total_honoraires': str(total_honoraires),
        'total_cout': str(total_cout),
        'masse_salariale': str(masse_salariale),
        'total_profit': str(total_profit),
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def sous_traitants(request):
    cabinet = request.user.cabinet
    if request.method == 'GET':
        qs = SousTraitant.objects.filter(cabinet=cabinet).select_related('projet')
        return Response(SousTraitantSerializer(qs, many=True).data)
    serializer = SousTraitantSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(cabinet=cabinet)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stats_sous_traitants(request):
    cabinet = request.user.cabinet
    qs = SousTraitant.objects.filter(cabinet=cabinet)
    agg = qs.aggregate(total=Sum('montant'), paye=Sum('montant', filter=Q(paye=True)))
    total = agg['total'] or 0
    paye  = agg['paye']  or 0
    return Response({
        'total_contrats': str(total),
        'total_paye':     str(paye),
        'total_reste':    str(total - paye),
        'actifs':         qs.filter(paye=False).count(),
        'total':          qs.count(),
    })


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def sous_traitant_detail(request, pk):
    try:
        st = SousTraitant.objects.select_related('projet').get(pk=pk, cabinet=request.user.cabinet)
    except SousTraitant.DoesNotExist:
        return Response({'error': 'Sous-traitant introuvable'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'GET':
        return Response(SousTraitantSerializer(st).data)
    if request.method == 'PUT':
        serializer = SousTraitantSerializer(st, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    st.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def phase_detail(request, pk):
    try:
        phase = Phase.objects.get(pk=pk, projet__cabinet=request.user.cabinet)
    except Phase.DoesNotExist:
        return Response({'error': 'Phase introuvable'}, status=404)
    serializer = PhaseSerializer(phase, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        projet = phase.projet
        if projet.phases.exists() and not projet.phases.filter(complete=False).exists():
            projet.statut = 'TERMINE'
            projet.save(update_fields=['statut'])
        elif projet.statut == 'TERMINE' and projet.phases.filter(complete=False).exists():
            projet.statut = 'EN_COURS'
            projet.save(update_fields=['statut'])
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def feuille_detail(request, pk):
    try:
        feuille = FeuilleDeTemps.objects.get(pk=pk, projet__cabinet=request.user.cabinet)
    except FeuilleDeTemps.DoesNotExist:
        return Response({'error': 'Introuvable'}, status=404)
    feuille.delete()
    return Response(status=204)


# ── Tâches ────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def taches(request, phase_pk):
    try:
        phase = Phase.objects.get(pk=phase_pk, projet__cabinet=request.user.cabinet)
    except Phase.DoesNotExist:
        return Response({'error': 'Phase introuvable'}, status=404)
    if request.method == 'GET':
        return Response(TacheSerializer(phase.taches.all(), many=True).data)
    serializer = TacheSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(phase=phase)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def toutes_taches(request):
    cabinet = request.user.cabinet
    qs = Tache.objects.filter(phase__projet__cabinet=cabinet).select_related('phase', 'phase__projet')
    projet_id = request.query_params.get('projet')
    if projet_id:
        qs = qs.filter(phase__projet_id=projet_id)
    return Response(TacheSerializer(qs, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mes_taches(request):
    """Tâches assignées à l'utilisateur connecté (non terminées/annulées)."""
    qs = Tache.objects.filter(
        assignee=request.user,
        phase__projet__cabinet=request.user.cabinet,
    ).exclude(statut__in=['TERMINE', 'ANNULE']).select_related('phase', 'phase__projet')
    data = []
    for t in qs:
        data.append({
            'id': t.id, 'titre': t.titre, 'statut': t.statut, 'priorite': t.priorite,
            'deadline': t.deadline, 'phase_nom': t.phase.nom,
            'projet_nom': t.phase.projet.nom, 'projet_id': t.phase.projet_id,
        })
    return Response(data)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def tache_detail(request, pk):
    try:
        tache = Tache.objects.select_related('phase__projet__cabinet').get(
            pk=pk, phase__projet__cabinet=request.user.cabinet
        )
    except Tache.DoesNotExist:
        return Response({'error': 'Tâche introuvable'}, status=404)
    if request.method == 'DELETE':
        tache.delete()
        return Response(status=204)
    ancien_statut = tache.statut
    serializer = TacheSerializer(tache, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        nouveau_statut = request.data.get('statut')
        if nouveau_statut == 'TERMINE' and ancien_statut != 'TERMINE' and not request.user.is_patron:
            cabinet = tache.phase.projet.cabinet
            from users.models import User as UserModel
            patron = UserModel.objects.filter(cabinet=cabinet, is_patron=True).first()
            if patron:
                Notification.objects.create(
                    cabinet=cabinet,
                    destinataire=patron,
                    message=f"{request.user.prenom} {request.user.nom} a terminé « {tache.titre} » — {tache.phase.projet.nom}",
                    lien=f"/projets/{tache.phase.projet_id}",
                )
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


# ── Permis de construire ──────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def permis_list(request):
    cabinet = request.user.cabinet
    if request.method == 'GET':
        qs = PermisConstruction.objects.filter(cabinet=cabinet).select_related('projet')
        projet_id = request.query_params.get('projet')
        if projet_id:
            qs = qs.filter(projet_id=projet_id)
        return Response(PermisConstructionSerializer(qs, many=True).data)
    serializer = PermisConstructionSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(cabinet=cabinet)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def permis_detail(request, pk):
    try:
        pc = PermisConstruction.objects.get(pk=pk, cabinet=request.user.cabinet)
    except PermisConstruction.DoesNotExist:
        return Response({'error': 'Permis introuvable'}, status=404)
    if request.method == 'GET':
        return Response(PermisConstructionSerializer(pc).data)
    if request.method == 'PUT':
        serializer = PermisConstructionSerializer(pc, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    pc.delete()
    return Response(status=204)


# ── Budget prévisionnel ───────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def budget_list(request):
    cabinet = request.user.cabinet
    if request.method == 'GET':
        qs = BudgetPoste.objects.filter(cabinet=cabinet).select_related('projet')
        projet_id = request.query_params.get('projet')
        if projet_id:
            qs = qs.filter(projet_id=projet_id)
        return Response(BudgetPosteSerializer(qs, many=True).data)
    serializer = BudgetPosteSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(cabinet=cabinet)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def budget_detail(request, pk):
    try:
        bp = BudgetPoste.objects.get(pk=pk, cabinet=request.user.cabinet)
    except BudgetPoste.DoesNotExist:
        return Response({'error': 'Poste introuvable'}, status=404)
    if request.method == 'GET':
        return Response(BudgetPosteSerializer(bp).data)
    if request.method == 'PUT':
        serializer = BudgetPosteSerializer(bp, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    bp.delete()
    return Response(status=204)


# ── Comptes rendus de réunion ─────────────────────────────────────

def _notifier_membres_reunion(reunion, cabinet, createur):
    from .models import Notification
    from users.models import User
    membres = User.objects.filter(cabinet=cabinet, is_active=True).exclude(pk=createur.pk)
    date_str = reunion.date.strftime('%d/%m/%Y') if reunion.date else ''
    message = f"Réunion : « {reunion.titre} » le {date_str} — {reunion.projet.nom}"
    for membre in membres:
        Notification.objects.create(
            cabinet=cabinet,
            destinataire=membre,
            message=message[:300],
            lien='/reunions',
        )

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def reunions_list(request):
    cabinet = request.user.cabinet
    if request.method == 'GET':
        qs = CompteRendu.objects.filter(cabinet=cabinet).select_related('projet')
        projet_id = request.query_params.get('projet')
        if projet_id:
            qs = qs.filter(projet_id=projet_id)
        return Response(CompteRenduSerializer(qs, many=True).data)
    serializer = CompteRenduSerializer(data=request.data)
    if serializer.is_valid():
        reunion = serializer.save(cabinet=cabinet)
        _notifier_membres_reunion(reunion, cabinet, request.user)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def reunion_detail(request, pk):
    try:
        cr = CompteRendu.objects.get(pk=pk, cabinet=request.user.cabinet)
    except CompteRendu.DoesNotExist:
        return Response({'error': 'Compte rendu introuvable'}, status=404)
    if request.method == 'GET':
        return Response(CompteRenduSerializer(cr).data)
    if request.method == 'PUT':
        serializer = CompteRenduSerializer(cr, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    cr.delete()
    return Response(status=204)


# ── Notifications ─────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications_list(request):
    notifs = Notification.objects.filter(destinataire=request.user)[:40]
    data = [
        {'id': n.id, 'message': n.message, 'lu': n.lu, 'lien': n.lien, 'date': n.date}
        for n in notifs
    ]
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def notifications_lire(request):
    Notification.objects.filter(destinataire=request.user, lu=False).update(lu=True)
    return Response({'ok': True})
