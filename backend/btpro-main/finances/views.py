from decimal import Decimal, InvalidOperation
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse
from django.core.mail import send_mail
from django.utils import timezone
from io import BytesIO
from xhtml2pdf import pisa
from .models import Devis, Facture, Paiement, Charge, ConfigPaie, FichePaie, LigneDevis, LigneFacture
from .serializers import DevisSerializer, FactureSerializer, PaiementSerializer, ChargeSerializer


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def devis(request):
    cabinet = request.user.cabinet
    if request.method == 'GET':
        qs = Devis.objects.filter(cabinet=cabinet)
        projet_id = request.query_params.get('projet')
        if projet_id:
            qs = qs.filter(projet_id=projet_id)
        return Response(DevisSerializer(qs, many=True).data)
    serializer = DevisSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(cabinet=cabinet)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def devis_detail(request, pk):
    try:
        d = Devis.objects.get(pk=pk, cabinet=request.user.cabinet)
    except Devis.DoesNotExist:
        return Response({'error': 'Devis introuvable'}, status=404)
    if request.method == 'GET':
        return Response(DevisSerializer(d).data)
    if request.method == 'PUT':
        ancien_statut = d.statut
        serializer = DevisSerializer(d, data=request.data, partial=True)
        if serializer.is_valid():
            instance = serializer.save()
            if ancien_statut != 'ACCEPTE' and instance.statut == 'ACCEPTE':
                _auto_creer_contrat(instance, request.user.cabinet)
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    d.delete()
    return Response(status=204)


def _auto_creer_contrat(devis, cabinet):
    from contrats.models import Contrat, ArticleContrat, ARTICLES_DEFAUT_CONTRAT
    from decimal import Decimal

    # Ne pas créer si un contrat existe déjà pour ce projet
    if Contrat.objects.filter(cabinet=cabinet, projet=devis.projet, type='CONTRAT').exists():
        return

    ttc = devis.montant_ttc
    ht = devis.montant_ht
    tva = Decimal('0') if not cabinet.assujetti_tva else Decimal('19')

    contrat = Contrat.objects.create(
        cabinet=cabinet,
        projet=devis.projet,
        client=devis.client,
        type='CONTRAT',
        statut='BROUILLON',
        objet=f"Maîtrise d'œuvre — {devis.projet.nom}",
        montant_ht=ht,
        tva=tva,
        montant_ttc=ttc,
        missions=[],
    )

    ttc_f = float(ttc)
    articles_personnalises = [
        ('Objet du contrat',
         f"Le présent contrat a pour objet de définir les conditions dans lesquelles le Maître d'œuvre est chargé par le Maître d'ouvrage de la réalisation des études d'architecture et du suivi d'exécution du projet {devis.projet.nom}."),
        ('Étendue de la mission',
         "La mission comprend les phases suivantes : Esquisse (ESQ), Avant-Projet Sommaire (APS), Avant-Projet Détaillé (APD), Permis de Construire (PC), Dossier Consultation Entreprises (DCE), Direction Exécution Travaux (DET), Assistance Opérations de Réception (AOR)."),
        ('Honoraires',
         f"En contrepartie de sa mission, le Maître d'œuvre percevra des honoraires d'un montant total de {'{:,.0f}'.format(ttc_f).replace(',', ' ')} DA TTC, TVA {tva}% incluse."),
        ('Modalités de paiement',
         f"30% à la signature du contrat — {'{:,.0f}'.format(ttc_f * 0.30).replace(',', ' ')} DA\n20% à la validation de l'APS — {'{:,.0f}'.format(ttc_f * 0.20).replace(',', ' ')} DA\n25% à la remise de l'APD et du permis de construire — {'{:,.0f}'.format(ttc_f * 0.25).replace(',', ' ')} DA\n15% à la remise du DCE — {'{:,.0f}'.format(ttc_f * 0.15).replace(',', ' ')} DA\n10% à la réception définitive des travaux — {'{:,.0f}'.format(ttc_f * 0.10).replace(',', ' ')} DA"),
        ('Durée & délais',
         "Le contrat prend effet à compter de sa date de signature. La durée d'exécution de la mission sera précisée par phase dans le planning général. Toute prolongation fera l'objet d'un avenant."),
        ('Obligations des parties',
         "Le Maître d'ouvrage s'engage à fournir les documents nécessaires et à régler les honoraires conformément à l'article sur les modalités de paiement. Le Maître d'œuvre s'engage à exécuter sa mission avec diligence, dans le respect des règles de l'art et des dispositions légales en vigueur en Algérie."),
        ('Assurance & responsabilité',
         "Le Maître d'œuvre déclare avoir souscrit une assurance professionnelle (Garantie Décennale et Responsabilité Civile) couvrant les risques liés à l'exercice de sa mission."),
        ('Résiliation',
         "En cas de manquement grave, le contrat pourra être résilié de plein droit, après mise en demeure restée sans effet pendant 30 jours. Les honoraires des phases déjà réalisées restent acquis au Maître d'œuvre."),
        ('Litiges & juridiction compétente',
         "Tout différend sera, à défaut de règlement amiable, porté devant le Tribunal d'Alger, seul compétent. Le contrat est soumis au droit algérien."),
    ]

    for i, (titre, contenu) in enumerate(articles_personnalises, start=1):
        ArticleContrat.objects.create(contrat=contrat, titre=titre, contenu=contenu, ordre=i)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def factures(request):
    cabinet = request.user.cabinet
    if request.method == 'GET':
        qs = Facture.objects.filter(cabinet=cabinet)
        projet_id = request.query_params.get('projet')
        if projet_id:
            qs = qs.filter(projet_id=projet_id)
        return Response(FactureSerializer(qs, many=True).data)
    serializer = FactureSerializer(data=request.data)
    if serializer.is_valid():
        projet_id = request.data.get('projet')
        if projet_id:
            devis_accepte = Devis.objects.filter(projet_id=projet_id, cabinet=cabinet, statut='ACCEPTE').order_by('-date_emission').first()
            if devis_accepte:
                from decimal import Decimal
                total_facture = sum(f.montant_ttc for f in Facture.objects.filter(projet_id=projet_id, cabinet=cabinet))
                # Compute montant_ttc from lignes (server-side computed, not in request directly)
                lignes_data = request.data.get('lignes', [])
                remise = Decimal(str(request.data.get('remise') or 0))
                try:
                    ttc_raw = sum(
                        Decimal(str(l.get('quantite', 1))) * Decimal(str(l.get('prix_unitaire', 0))) * (1 + Decimal(str(l.get('tva', 0))) / 100)
                        for l in lignes_data
                    )
                    nouveau_montant = ttc_raw * (1 - remise / 100)
                except (InvalidOperation, TypeError, KeyError):
                    nouveau_montant = Decimal('0')
                if total_facture + nouveau_montant > devis_accepte.montant_ttc:
                    reste = devis_accepte.montant_ttc - total_facture
                    return Response({
                        'error': f'Plafond dépassé — vous pouvez encore facturer {float(reste):,.0f} DA sur ce projet (devis validé : {float(devis_accepte.montant_ttc):,.0f} DA, déjà facturé : {float(total_facture):,.0f} DA)'
                    }, status=400)
        serializer.save(cabinet=cabinet)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def facture_detail(request, pk):
    try:
        f = Facture.objects.get(pk=pk, cabinet=request.user.cabinet)
    except Facture.DoesNotExist:
        return Response({'error': 'Facture introuvable'}, status=404)
    if request.method == 'GET':
        return Response(FactureSerializer(f).data)
    if request.method == 'PUT':
        serializer = FactureSerializer(f, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    f.delete()
    return Response(status=204)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def convertir_devis(request, pk):
    """Convertit un devis accepté en facture en reprenant toutes ses lignes."""
    try:
        devis = Devis.objects.get(pk=pk, cabinet=request.user.cabinet)
    except Devis.DoesNotExist:
        return Response({'error': 'Devis introuvable'}, status=404)

    if devis.statut != 'ACCEPTE':
        return Response({'error': 'Seul un devis accepté peut être converti en facture'}, status=400)

    from django.utils import timezone
    import datetime

    date_echeance = request.data.get('date_echeance') or (
        timezone.now().date() + datetime.timedelta(days=30)
    )

    facture = Facture.objects.create(
        cabinet=devis.cabinet,
        client=devis.client,
        projet=devis.projet,
        statut='EMISE',
        montant_ht=devis.montant_ht,
        montant_ttc=devis.montant_ttc,
        remise=devis.remise,
        date_echeance=date_echeance,
        conditions_paiement=devis.conditions_paiement,
        rib=devis.rib,
        mentions_legales=devis.mentions_legales,
        notes=devis.notes,
    )

    for ligne in devis.lignes.all():
        LigneFacture.objects.create(
            facture=facture,
            designation=ligne.designation,
            quantite=ligne.quantite,
            prix_unitaire=ligne.prix_unitaire,
            tva=ligne.tva,
            ordre=ligne.ordre,
        )

    return Response(FactureSerializer(facture).data, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ajouter_paiement(request, facture_pk):
    try:
        facture = Facture.objects.get(pk=facture_pk, cabinet=request.user.cabinet)
    except Facture.DoesNotExist:
        return Response({'error': 'Facture introuvable'}, status=404)

    try:
        montant = Decimal(str(request.data.get('montant', '')))
        if montant <= 0:
            return Response({'error': 'Le montant doit être positif'}, status=400)
    except (InvalidOperation, ValueError):
        return Response({'error': 'Montant invalide'}, status=400)

    montant_deja_paye = sum(p.montant for p in facture.paiements.all())
    reste = facture.montant_ttc - montant_deja_paye

    if montant > reste:
        return Response({
            'error': f'Le montant dépasse le reste à payer ({reste:,.0f} DA). Déjà payé : {montant_deja_paye:,.0f} DA.'
        }, status=400)

    serializer = PaiementSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(facture=facture)
        montant_total_paye = montant_deja_paye + montant
        if montant_total_paye >= facture.montant_ttc:
            facture.statut = 'SOLDEE'
        else:
            facture.statut = 'PARTIELLEMENT_PAYEE'
        facture.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def charges(request):
    cabinet = request.user.cabinet
    if request.method == 'GET':
        data = Charge.objects.filter(cabinet=cabinet)
        return Response(ChargeSerializer(data, many=True).data)
    serializer = ChargeSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(cabinet=cabinet, paye_par=request.user)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def charge_detail(request, pk):
    try:
        charge = Charge.objects.get(pk=pk, cabinet=request.user.cabinet)
    except Charge.DoesNotExist:
        return Response({'error': 'Charge introuvable'}, status=404)
    if request.method == 'PUT':
        serializer = ChargeSerializer(charge, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    # Supprimer la fiche de paie MENSUEL liée si elle existe
    try:
        charge.fiche_paie.delete()
    except Exception:
        pass
    charge.delete()
    return Response(status=204)


def _f(n):
    return '{:,.0f}'.format(n).replace(',', '&#160;')


def _nombre_lettres(n):
    try:
        n = int(n)
    except Exception:
        return ''
    if n == 0:
        return 'ZERO'
    U = ['', 'UN', 'DEUX', 'TROIS', 'QUATRE', 'CINQ', 'SIX', 'SEPT', 'HUIT', 'NEUF',
         'DIX', 'ONZE', 'DOUZE', 'TREIZE', 'QUATORZE', 'QUINZE', 'SEIZE',
         'DIX-SEPT', 'DIX-HUIT', 'DIX-NEUF']
    DIZ = ['', 'DIX', 'VINGT', 'TRENTE', 'QUARANTE', 'CINQUANTE', 'SOIXANTE']

    def _diz(n):
        if n < 20:
            return U[n]
        t, u = divmod(n, 10)
        if t == 7:
            return 'SOIXANTE-' + U[10 + u]
        if t == 8:
            return 'QUATRE-VINGTS' if u == 0 else 'QUATRE-VINGT-' + U[u]
        if t == 9:
            return 'QUATRE-VINGT-' + U[10 + u]
        if u == 0:
            return DIZ[t]
        return DIZ[t] + (' ET ' if u == 1 else '-') + U[u]

    def _cent(n):
        if n < 100:
            return _diz(n)
        c, r = divmod(n, 100)
        prefix = '' if c == 1 else U[c] + ' '
        cent = 'CENTS' if (c > 1 and r == 0) else 'CENT'
        return (prefix + cent) if r == 0 else (prefix + cent + ' ' + _diz(r))

    parts = []
    if n >= 1_000_000_000:
        b, n = divmod(n, 1_000_000_000)
        parts.append(_cent(b) + (' MILLIARD' if b == 1 else ' MILLIARDS'))
    if n >= 1_000_000:
        m, n = divmod(n, 1_000_000)
        parts.append(_cent(m) + (' MILLION' if m == 1 else ' MILLIONS'))
    if n >= 1_000:
        k, n = divmod(n, 1_000)
        parts.append('MILLE' if k == 1 else _cent(k) + ' MILLE')
    if n > 0:
        parts.append(_cent(n))
    return ' '.join(p.strip() for p in parts)


def _montant_lettres(amount):
    from decimal import Decimal
    try:
        d = Decimal(str(amount))
        entier = int(d)
        centimes = int(round((d - entier) * 100))
    except Exception:
        return ''
    r = _nombre_lettres(entier) + ' DINARS ALGERIENS'
    r += ' ET ' + (_nombre_lettres(centimes) + ' CENTIMES' if centimes else 'ZERO CENTIME')
    return r


def _coord_row(label, value):
    if not value:
        return ''
    return f'<tr><td style="padding:1px 0;font-size:11px;color:#475569;width:90px;">{label}</td><td style="padding:1px 0;font-size:11px;color:#1E293B;font-weight:600;">: {value}</td></tr>'


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def facture_pdf(request, pk):
    try:
        facture = Facture.objects.get(pk=pk, cabinet=request.user.cabinet)
    except Facture.DoesNotExist:
        return Response({'error': 'Facture introuvable'}, status=404)

    cabinet = request.user.cabinet
    cl = facture.client
    paiements = list(facture.paiements.all())
    montant_paye = sum(p.montant for p in paiements)
    reste = facture.montant_ttc - montant_paye
    tva_montant = facture.montant_ttc - facture.montant_ht

    statut_color = {
        'EMISE': '#6366F1', 'ENVOYEE': '#6366F1',
        'PARTIELLEMENT_PAYEE': '#EA580C', 'SOLDEE': '#16A34A', 'ANNULEE': '#DC2626',
    }.get(facture.statut, '#64748B')
    statut_label = {
        'EMISE': 'Emise', 'ENVOYEE': 'Envoyee',
        'PARTIELLEMENT_PAYEE': 'Part. payee', 'SOLDEE': 'Soldee', 'ANNULEE': 'Annulee',
    }.get(facture.statut, facture.statut)

    phase_text = f' &mdash; {facture.phase.nom}' if facture.phase else ''
    assujetti_tva = cabinet.assujetti_tva
    tva_pct = round(float(tva_montant) / float(facture.montant_ht) * 100, 0) if float(facture.montant_ht) > 0 else 0

    notes_block = ''
    if facture.notes:
        notes_block = f'''
<table style="width:100%;border-collapse:collapse;"><tr><td style="padding:0 28px 14px;">
<table style="width:100%;border-collapse:collapse;">
  <tr><td style="background-color:#F8FAFC;border-left:3px solid #6366F1;padding:10px 14px;font-size:11px;color:#475569;line-height:1.7;">
    <strong style="display:block;font-size:9px;color:#6366F1;margin-bottom:3px;font-weight:700;">NOTES</strong>{facture.notes}
  </td></tr>
</table>
</td></tr></table>'''

    paiements_rows = ''
    paiements_block = ''
    if paiements:
        for p in paiements:
            paiements_rows += f'<tr><td style="padding:8px 12px;font-size:11px;color:#374151;border-bottom:1px solid #F8FAFC;">{p.date_paiement.strftime("%d/%m/%Y")}</td><td style="padding:8px 12px;font-size:11px;color:#374151;border-bottom:1px solid #F8FAFC;">{p.get_mode_display()}</td><td style="padding:8px 12px;font-size:11px;color:#374151;border-bottom:1px solid #F8FAFC;">{p.reference or "&#8212;"}</td><td style="padding:8px 12px;font-size:11px;color:#374151;border-bottom:1px solid #F8FAFC;text-align:right;font-weight:600;">{_f(p.montant)}&#160;DA</td></tr>'
        paiements_block = f'''
<table style="width:100%;border-collapse:collapse;"><tr><td style="padding:0 28px 14px;">
<table style="width:100%;border-collapse:collapse;">
  <tr><td colspan="4" style="padding:0 0 6px;font-size:9px;font-weight:700;color:#64748B;">HISTORIQUE DES PAIEMENTS</td></tr>
  <tr><th style="padding:7px 12px;text-align:left;font-size:9px;font-weight:700;color:#94A3B8;background-color:#F8FAFC;border-bottom:1px solid #E2E8F0;">DATE</th><th style="padding:7px 12px;text-align:left;font-size:9px;font-weight:700;color:#94A3B8;background-color:#F8FAFC;border-bottom:1px solid #E2E8F0;">MODE</th><th style="padding:7px 12px;text-align:left;font-size:9px;font-weight:700;color:#94A3B8;background-color:#F8FAFC;border-bottom:1px solid #E2E8F0;">REFERENCE</th><th style="padding:7px 12px;text-align:right;font-size:9px;font-weight:700;color:#94A3B8;background-color:#F8FAFC;border-bottom:1px solid #E2E8F0;">MONTANT</th></tr>
  {paiements_rows}
</table>
</td></tr></table>'''

    reste_rows = ''
    if paiements:
        reste_rows = f'<tr><td style="padding:7px 14px;font-size:11px;color:#64748B;border-top:1px solid #E2E8F0;">Deja paye</td><td style="padding:7px 14px;font-size:11px;color:#16A34A;font-weight:700;text-align:right;border-top:1px solid #E2E8F0;width:140px;">&#8722;&#160;{_f(montant_paye)}&#160;DA</td></tr><tr><td style="padding:7px 14px;font-size:12px;color:#0F172A;font-weight:700;border-top:1px solid #E2E8F0;">Reste a payer</td><td style="padding:7px 14px;font-size:12px;color:#EA580C;font-weight:800;text-align:right;border-top:1px solid #E2E8F0;">{_f(reste)}&#160;DA</td></tr>'

    import base64 as _b64, os as _os
    logo_html_f = ''
    if cabinet.logo and cabinet.logo.name:
        try:
            with open(cabinet.logo.path, 'rb') as _lf:
                _raw = _b64.b64encode(_lf.read()).decode()
            _ext = _os.path.splitext(cabinet.logo.name)[1].lower().strip('.')
            _mime = {'png': 'png', 'jpg': 'jpeg', 'jpeg': 'jpeg'}.get(_ext, 'png')
            logo_html_f = f'<img src="data:image/{_mime};base64,{_raw}" style="height:44px;max-width:120px;display:block;margin-bottom:6px;" />'
        except Exception:
            logo_html_f = ''

    html = f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
@page {{ size: A4 portrait; margin: 0; }}
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ font-family: Helvetica, Arial, sans-serif; background:#ffffff; color:#1E293B; font-size:12px; }}
</style>
</head><body>

<!-- HEADER BAND -->
<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="background-color:#0F172A;padding:22px 28px;width:52%;vertical-align:top;border-bottom:4px solid #6366F1;">
      {logo_html_f}<div style="font-size:21px;font-weight:900;color:#A5B4FC;letter-spacing:-0.5px;">{cabinet.nom}</div>
      <div style="font-size:10px;color:#64748B;margin-top:2px;">{cabinet.activite or "Cabinet d'Architecture"}</div>
    </td>
    <td style="background-color:#0F172A;padding:22px 28px;width:48%;vertical-align:top;text-align:right;border-bottom:4px solid #6366F1;">
      <div style="font-size:36px;font-weight:900;color:#ffffff;letter-spacing:-1px;line-height:1;">FACTURE</div>
      <div style="font-size:13px;color:#6366F1;font-weight:700;margin-top:4px;">N&#176; {facture.numero}</div>
    </td>
  </tr>
</table>

<!-- COORDINATES + DOC INFO -->
<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="width:50%;vertical-align:top;padding:16px 28px;background-color:#F8FAFC;border-bottom:1px solid #E2E8F0;">
      <table style="border-collapse:collapse;">
        {_coord_row('Adresse', cabinet.adresse)}
        {_coord_row('Tel', cabinet.telephone)}
        {_coord_row('Email', cabinet.email)}
        {_coord_row('RC', cabinet.numero_rc)}
        {_coord_row('NIF', cabinet.nif)}
        {_coord_row('AI', cabinet.ai)}
        {_coord_row('NIS', cabinet.nis)}
      </table>
    </td>
    <td style="width:50%;vertical-align:top;padding:16px 28px;background-color:#F8FAFC;border-bottom:1px solid #E2E8F0;">
      <table style="border-collapse:collapse;margin-left:auto;">
        <tr><td style="padding:2px 0;font-size:11px;color:#475569;width:100px;">Date d'emission</td><td style="padding:2px 0;font-size:11px;color:#1E293B;font-weight:600;">: {facture.date_emission.strftime('%d/%m/%Y')}</td></tr>
        <tr><td style="padding:2px 0;font-size:11px;color:#475569;">Date d'echeance</td><td style="padding:2px 0;font-size:11px;color:#1E293B;font-weight:600;">: {facture.date_echeance.strftime('%d/%m/%Y')}</td></tr>
        <tr><td style="padding:6px 0 2px;font-size:11px;color:#475569;">Statut</td><td style="padding:6px 0 2px;font-size:11px;font-weight:700;color:{statut_color};">: {statut_label}</td></tr>
      </table>
    </td>
  </tr>
</table>

<!-- DESTINATAIRE -->
<table style="width:100%;border-collapse:collapse;"><tr><td style="padding:20px 28px 0;">
<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="background-color:#F1F5F9;padding:6px 14px;font-size:9px;font-weight:700;color:#64748B;" colspan="2">DESTINATAIRE</td>
  </tr>
  <tr>
    <td style="vertical-align:top;padding:12px 14px;border:1px solid #E2E8F0;width:55%;">
      <div style="font-size:14px;font-weight:700;color:#0F172A;margin-bottom:8px;">{cl.nom}</div>
      <table style="border-collapse:collapse;">
        {_coord_row('Adresse', cl.adresse)}
        {_coord_row('Contact', cl.contact_nom)}
        {_coord_row('Tel', cl.telephone)}
        {_coord_row('Email', cl.email)}
        {_coord_row('RC', cl.numero_rc)}
        {_coord_row('NIF', cl.nif)}
        {_coord_row('AI', cl.ai)}
        {_coord_row('NIS', cl.nis)}
      </table>
    </td>
    <td style="width:45%;vertical-align:top;padding:12px 14px;"></td>
  </tr>
</table>
</td></tr></table>

<!-- ITEMS TABLE -->
<table style="width:100%;border-collapse:collapse;"><tr><td style="padding:16px 28px 0;">
<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="background-color:#1E3A5F;padding:10px 14px;font-size:10px;font-weight:700;color:#ffffff;width:{'35%' if assujetti_tva else '40%'};">DESIGNATION</td>
    <td style="background-color:#1E3A5F;padding:10px 14px;font-size:10px;font-weight:700;color:#ffffff;width:{'21%' if assujetti_tva else '26%'};">PROJET</td>
    <td style="background-color:#1E3A5F;padding:10px 14px;font-size:10px;font-weight:700;color:#ffffff;text-align:center;width:5%;">QTE</td>
    <td style="background-color:#1E3A5F;padding:10px 14px;font-size:10px;font-weight:700;color:#ffffff;text-align:right;width:{'17%' if assujetti_tva else '12%'};">PRIX&#160;HT</td>
    {'<td style="background-color:#1E3A5F;padding:10px 14px;font-size:10px;font-weight:700;color:#ffffff;text-align:center;width:5%;">TVA</td>' if assujetti_tva else ''}
    <td style="background-color:#1E3A5F;padding:10px 14px;font-size:10px;font-weight:700;color:#ffffff;text-align:right;width:17%;">MONTANT</td>
  </tr>
  <tr>
    <td style="padding:12px 14px;font-size:12px;color:#374151;border-bottom:1px solid #E2E8F0;">Honoraires d'architecture</td>
    <td style="padding:12px 14px;font-size:12px;color:#374151;border-bottom:1px solid #E2E8F0;">{facture.projet.nom}{phase_text}</td>
    <td style="padding:12px 14px;font-size:12px;color:#374151;border-bottom:1px solid #E2E8F0;text-align:center;">1</td>
    <td style="padding:12px 14px;font-size:12px;color:#374151;border-bottom:1px solid #E2E8F0;text-align:right;">{_f(facture.montant_ht)}&#160;DA</td>
    {'<td style="padding:12px 14px;font-size:12px;color:#374151;border-bottom:1px solid #E2E8F0;text-align:center;">' + str(int(tva_pct)) + '%</td>' if assujetti_tva else ''}
    <td style="padding:12px 14px;font-size:12px;font-weight:700;color:#0F172A;border-bottom:1px solid #E2E8F0;text-align:right;">{_f(facture.montant_ttc)}&#160;DA</td>
  </tr>
</table>
</td></tr></table>

<!-- TOTAUX -->
<table style="width:100%;border-collapse:collapse;"><tr><td style="padding:4px 28px 16px;">
<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="width:52%;vertical-align:top;padding-top:8px;font-size:11px;color:#64748B;line-height:1.9;">
      <strong style="display:block;font-size:9px;color:#94A3B8;margin-bottom:4px;font-weight:700;">MODES DE PAIEMENT ACCEPTES</strong>
      Virement bancaire &nbsp;|&nbsp; Cheque &nbsp;|&nbsp; CCP &nbsp;|&nbsp; Especes
      {'<br/><br/><em style="font-size:10px;color:#475569;">&laquo;&nbsp;Non assujetti &agrave; la TVA&nbsp;&raquo;</em>' if not assujetti_tva else ''}
    </td>
    <td style="width:48%;vertical-align:top;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:7px 14px;font-size:12px;color:#64748B;border-bottom:1px solid #F1F5F9;text-align:right;">Total HT</td><td style="padding:7px 14px;font-size:12px;color:#374151;font-weight:600;text-align:right;border-bottom:1px solid #F1F5F9;width:145px;">{_f(facture.montant_ht)}&#160;DA</td></tr>
        {'<tr><td style="padding:7px 14px;font-size:12px;color:#64748B;border-bottom:1px solid #F1F5F9;text-align:right;">Total TVA (' + str(int(tva_pct)) + '%)</td><td style="padding:7px 14px;font-size:12px;color:#374151;font-weight:600;text-align:right;border-bottom:1px solid #F1F5F9;">' + _f(tva_montant) + '&#160;DA</td></tr>' if assujetti_tva else ''}
        <tr><td style="padding:10px 14px;font-size:13px;font-weight:700;color:#ffffff;background-color:#1E3A5F;text-align:right;">Total TTC</td><td style="padding:10px 14px;font-size:13px;font-weight:800;color:#ffffff;background-color:#1E3A5F;text-align:right;">{_f(facture.montant_ttc)}&#160;DA</td></tr>
        {reste_rows}
      </table>
    </td>
  </tr>
</table>
</td></tr></table>

{notes_block}
{paiements_block}

<!-- ARRETE -->
<table style="width:100%;border-collapse:collapse;"><tr><td style="padding:10px 28px 20px;">
<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="border:1px solid #E2E8F0;padding:10px 14px;background-color:#F8FAFC;">
      <div style="font-size:9px;font-weight:700;color:#64748B;margin-bottom:3px;">ARRETE LE PRESENT DOCUMENT A LA SOMME DE :</div>
      <div style="font-size:11px;font-weight:700;color:#0F172A;">{_montant_lettres(facture.montant_ttc)}</div>
    </td>
  </tr>
</table>
</td></tr></table>

<!-- SIGNATURE -->
<table style="width:100%;border-collapse:collapse;"><tr><td style="padding:0 28px 0;">
<table style="width:100%;border-collapse:collapse;border-top:1px solid #E2E8F0;">
  <tr>
    <td style="width:55%;padding-top:14px;font-size:11px;color:#64748B;vertical-align:top;">
      <strong style="display:block;font-size:9px;color:#94A3B8;margin-bottom:4px;font-weight:700;">INFORMATIONS BANCAIRES</strong>
      Virement bancaire / Cheque / CCP
    </td>
    <td style="width:45%;padding-top:14px;text-align:right;vertical-align:top;">
      <div style="font-size:9px;font-weight:700;color:#94A3B8;margin-bottom:36px;">CACHET ET SIGNATURE</div>
      <div style="font-size:11px;color:#CBD5E1;">________________________________</div>
    </td>
  </tr>
</table>
</td></tr></table>

<!-- MENTION -->
<table style="width:100%;border-collapse:collapse;"><tr><td style="padding:16px 28px 28px;text-align:center;font-size:9px;color:#CBD5E1;border-top:1px solid #F1F5F9;">
  Document genere par BTPro &#183; {cabinet.nom} &#183; {facture.date_emission.strftime('%d/%m/%Y')}
</td></tr></table>

</body></html>"""

    result = BytesIO()
    pisa.CreatePDF(html, dest=result)
    response = HttpResponse(result.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="facture_{facture.numero}.pdf"'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def devis_pdf(request, pk):
    try:
        d = Devis.objects.get(pk=pk, cabinet=request.user.cabinet)
    except Devis.DoesNotExist:
        return Response({'error': 'Devis introuvable'}, status=404)

    cabinet = request.user.cabinet
    cl = d.client
    tva_montant = d.montant_ttc - d.montant_ht

    statut_color = {
        'BROUILLON': '#64748B', 'ENVOYE': '#6366F1',
        'ACCEPTE': '#16A34A', 'REFUSE': '#DC2626',
    }.get(d.statut, '#64748B')
    statut_label = {
        'BROUILLON': 'Brouillon', 'ENVOYE': 'Envoye',
        'ACCEPTE': 'Accepte', 'REFUSE': 'Refuse',
    }.get(d.statut, d.statut)

    description = d.notes if d.notes else "Honoraires d'architecture"
    projet_text = d.projet.nom if d.projet else '&#8212;'
    date_validite = d.date_validite.strftime('%d/%m/%Y') if d.date_validite else 'N/A'
    assujetti_tva_d = cabinet.assujetti_tva
    tva_pct_d = round(float(tva_montant) / float(d.montant_ht) * 100, 0) if float(d.montant_ht) > 0 else 0

    import base64 as _b64d, os as _osd
    logo_html_d = ''
    if cabinet.logo and cabinet.logo.name:
        try:
            with open(cabinet.logo.path, 'rb') as _lf:
                _raw = _b64d.b64encode(_lf.read()).decode()
            _ext = _osd.path.splitext(cabinet.logo.name)[1].lower().strip('.')
            _mime = {'png': 'png', 'jpg': 'jpeg', 'jpeg': 'jpeg'}.get(_ext, 'png')
            logo_html_d = f'<img src="data:image/{_mime};base64,{_raw}" style="height:44px;max-width:120px;display:block;margin-bottom:6px;" />'
        except Exception:
            logo_html_d = ''

    html = f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
@page {{ size: A4 portrait; margin: 0; }}
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ font-family: Helvetica, Arial, sans-serif; background:#ffffff; color:#1E293B; font-size:12px; }}
</style>
</head><body>

<!-- HEADER BAND -->
<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="background-color:#0F172A;padding:22px 28px;width:52%;vertical-align:top;border-bottom:4px solid #10B981;">
      {logo_html_d}<div style="font-size:21px;font-weight:900;color:#6EE7B7;letter-spacing:-0.5px;">{cabinet.nom}</div>
      <div style="font-size:10px;color:#64748B;margin-top:2px;">{cabinet.activite or "Cabinet d'Architecture"}</div>
    </td>
    <td style="background-color:#0F172A;padding:22px 28px;width:48%;vertical-align:top;text-align:right;border-bottom:4px solid #10B981;">
      <div style="font-size:36px;font-weight:900;color:#ffffff;letter-spacing:-1px;line-height:1;">DEVIS</div>
      <div style="font-size:13px;color:#10B981;font-weight:700;margin-top:4px;">N&#176; {d.numero}</div>
    </td>
  </tr>
</table>

<!-- COORDINATES + DOC INFO -->
<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="width:50%;vertical-align:top;padding:16px 28px;background-color:#F8FAFC;border-bottom:1px solid #E2E8F0;">
      <table style="border-collapse:collapse;">
        {_coord_row('Adresse', cabinet.adresse)}
        {_coord_row('Tel', cabinet.telephone)}
        {_coord_row('Email', cabinet.email)}
        {_coord_row('RC', cabinet.numero_rc)}
        {_coord_row('NIF', cabinet.nif)}
        {_coord_row('AI', cabinet.ai)}
        {_coord_row('NIS', cabinet.nis)}
      </table>
    </td>
    <td style="width:50%;vertical-align:top;padding:16px 28px;background-color:#F8FAFC;border-bottom:1px solid #E2E8F0;">
      <table style="border-collapse:collapse;margin-left:auto;">
        <tr><td style="padding:2px 0;font-size:11px;color:#475569;width:100px;">Date d'emission</td><td style="padding:2px 0;font-size:11px;color:#1E293B;font-weight:600;">: {d.date_emission.strftime('%d/%m/%Y')}</td></tr>
        <tr><td style="padding:2px 0;font-size:11px;color:#475569;">Valable jusqu'au</td><td style="padding:2px 0;font-size:11px;color:#1E293B;font-weight:600;">: {date_validite}</td></tr>
        <tr><td style="padding:6px 0 2px;font-size:11px;color:#475569;">Statut</td><td style="padding:6px 0 2px;font-size:11px;font-weight:700;color:{statut_color};">: {statut_label}</td></tr>
      </table>
    </td>
  </tr>
</table>

<!-- DESTINATAIRE -->
<table style="width:100%;border-collapse:collapse;"><tr><td style="padding:20px 28px 0;">
<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="background-color:#F1F5F9;padding:6px 14px;font-size:9px;font-weight:700;color:#64748B;" colspan="2">DESTINATAIRE</td>
  </tr>
  <tr>
    <td style="vertical-align:top;padding:12px 14px;border:1px solid #E2E8F0;width:55%;">
      <div style="font-size:14px;font-weight:700;color:#0F172A;margin-bottom:8px;">{cl.nom}</div>
      <table style="border-collapse:collapse;">
        {_coord_row('Adresse', cl.adresse)}
        {_coord_row('Contact', cl.contact_nom)}
        {_coord_row('Tel', cl.telephone)}
        {_coord_row('Email', cl.email)}
        {_coord_row('RC', cl.numero_rc)}
        {_coord_row('NIF', cl.nif)}
        {_coord_row('AI', cl.ai)}
        {_coord_row('NIS', cl.nis)}
      </table>
    </td>
    <td style="width:45%;vertical-align:top;padding:12px 14px;font-size:11px;color:#64748B;line-height:1.9;">
      <strong style="display:block;font-size:9px;color:#94A3B8;margin-bottom:4px;font-weight:700;">CONDITIONS</strong>
      Ce devis est valable jusqu'au {date_validite}.<br>
      Tout accord doit etre formalise par ecrit.<br>
      Delai d'execution apres signature.
    </td>
  </tr>
</table>
</td></tr></table>

<!-- ITEMS TABLE -->
<table style="width:100%;border-collapse:collapse;"><tr><td style="padding:16px 28px 0;">
<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="background-color:#1E3A5F;padding:10px 14px;font-size:10px;font-weight:700;color:#ffffff;width:{'35%' if assujetti_tva_d else '40%'};">DESIGNATION</td>
    <td style="background-color:#1E3A5F;padding:10px 14px;font-size:10px;font-weight:700;color:#ffffff;width:{'21%' if assujetti_tva_d else '26%'};">PROJET</td>
    <td style="background-color:#1E3A5F;padding:10px 14px;font-size:10px;font-weight:700;color:#ffffff;text-align:center;width:5%;">QTE</td>
    <td style="background-color:#1E3A5F;padding:10px 14px;font-size:10px;font-weight:700;color:#ffffff;text-align:right;width:{'17%' if assujetti_tva_d else '12%'};">PRIX&#160;HT</td>
    {'<td style="background-color:#1E3A5F;padding:10px 14px;font-size:10px;font-weight:700;color:#ffffff;text-align:center;width:5%;">TVA</td>' if assujetti_tva_d else ''}
    <td style="background-color:#1E3A5F;padding:10px 14px;font-size:10px;font-weight:700;color:#ffffff;text-align:right;width:17%;">MONTANT</td>
  </tr>
  <tr>
    <td style="padding:12px 14px;font-size:12px;color:#374151;border-bottom:1px solid #E2E8F0;">{description}</td>
    <td style="padding:12px 14px;font-size:12px;color:#374151;border-bottom:1px solid #E2E8F0;">{projet_text}</td>
    <td style="padding:12px 14px;font-size:12px;color:#374151;border-bottom:1px solid #E2E8F0;text-align:center;">1</td>
    <td style="padding:12px 14px;font-size:12px;color:#374151;border-bottom:1px solid #E2E8F0;text-align:right;">{_f(d.montant_ht)}&#160;DA</td>
    {'<td style="padding:12px 14px;font-size:12px;color:#374151;border-bottom:1px solid #E2E8F0;text-align:center;">' + str(int(tva_pct_d)) + '%</td>' if assujetti_tva_d else ''}
    <td style="padding:12px 14px;font-size:12px;font-weight:700;color:#0F172A;border-bottom:1px solid #E2E8F0;text-align:right;">{_f(d.montant_ttc)}&#160;DA</td>
  </tr>
</table>
</td></tr></table>

<!-- TOTAUX -->
<table style="width:100%;border-collapse:collapse;"><tr><td style="padding:4px 28px 16px;">
<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="width:52%;vertical-align:top;padding-top:8px;">
      {'<em style="font-size:10px;color:#475569;">&laquo;&nbsp;Non assujetti &agrave; la TVA&nbsp;&raquo;</em>' if not assujetti_tva_d else ''}
    </td>
    <td style="width:48%;vertical-align:top;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:7px 14px;font-size:12px;color:#64748B;border-bottom:1px solid #F1F5F9;text-align:right;">Total HT</td><td style="padding:7px 14px;font-size:12px;color:#374151;font-weight:600;text-align:right;border-bottom:1px solid #F1F5F9;width:145px;">{_f(d.montant_ht)}&#160;DA</td></tr>
        {'<tr><td style="padding:7px 14px;font-size:12px;color:#64748B;border-bottom:1px solid #F1F5F9;text-align:right;">Total TVA (' + str(int(tva_pct_d)) + '%)</td><td style="padding:7px 14px;font-size:12px;color:#374151;font-weight:600;text-align:right;border-bottom:1px solid #F1F5F9;">' + _f(tva_montant) + '&#160;DA</td></tr>' if assujetti_tva_d else ''}
        <tr><td style="padding:10px 14px;font-size:13px;font-weight:700;color:#ffffff;background-color:#1E3A5F;text-align:right;">Total TTC</td><td style="padding:10px 14px;font-size:13px;font-weight:800;color:#ffffff;background-color:#1E3A5F;text-align:right;">{_f(d.montant_ttc)}&#160;DA</td></tr>
      </table>
    </td>
  </tr>
</table>
</td></tr></table>

<!-- ARRETE -->
<table style="width:100%;border-collapse:collapse;"><tr><td style="padding:10px 28px 20px;">
<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="border:1px solid #E2E8F0;padding:10px 14px;background-color:#F8FAFC;">
      <div style="font-size:9px;font-weight:700;color:#64748B;margin-bottom:3px;">ARRETE LE PRESENT DEVIS A LA SOMME DE :</div>
      <div style="font-size:11px;font-weight:700;color:#0F172A;">{_montant_lettres(d.montant_ttc)}</div>
    </td>
  </tr>
</table>
</td></tr></table>

<!-- BON POUR ACCORD -->
<table style="width:100%;border-collapse:collapse;"><tr><td style="padding:0 28px 0;">
<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="border:1.5px solid #10B981;padding:14px 18px;background-color:#F0FDF4;">
      <div style="font-size:10px;font-weight:700;color:#065F46;margin-bottom:12px;">BON POUR ACCORD &mdash; Lu et approuve</div>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="width:50%;font-size:11px;color:#64748B;">Date : ________________________</td>
          <td style="width:50%;font-size:11px;color:#64748B;text-align:right;">Cachet et signature : ________________________</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</td></tr></table>

<!-- MENTION -->
<table style="width:100%;border-collapse:collapse;"><tr><td style="padding:16px 28px 28px;text-align:center;font-size:9px;color:#CBD5E1;border-top:1px solid #F1F5F9;">
  Document genere par BTPro &#183; {cabinet.nom} &#183; {d.date_emission.strftime('%d/%m/%Y')}
</td></tr></table>

</body></html>"""

    result = BytesIO()
    pisa.CreatePDF(html, dest=result)
    response = HttpResponse(result.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="devis_{d.numero}.pdf"'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def alertes_impayes(request):
    cabinet = request.user.cabinet
    aujourd_hui = timezone.now().date()

    factures_impayes = Facture.objects.filter(
        cabinet=cabinet,
        statut__in=['EMISE', 'ENVOYEE', 'PARTIELLEMENT_PAYEE'],
    )

    alertes = []
    for f in factures_impayes:
        if not f.date_echeance:
            continue
        jours = (aujourd_hui - f.date_echeance).days
        if jours > 0:
            if jours > 60:
                niveau = 'CRITIQUE'
            elif jours > 30:
                niveau = 'URGENT'
            else:
                niveau = 'ATTENTION'
            alertes.append({
                'id': f.id,
                'numero': f.numero,
                'client': f.client.nom,
                'client_email': f.client.email or '',
                'montant': str(f.montant_ttc),
                'date_echeance': str(f.date_echeance),
                'jours_retard': jours,
                'niveau': niveau,
            })

    return Response({
        'total_alertes': len(alertes),
        'total_impaye': str(sum(float(a['montant']) for a in alertes)),
        'alertes': sorted(alertes, key=lambda x: x['jours_retard'], reverse=True)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def envoyer_relance(request, pk):
    try:
        facture = Facture.objects.get(pk=pk, cabinet=request.user.cabinet)
    except Facture.DoesNotExist:
        return Response({'error': 'Facture introuvable'}, status=404)

    if not facture.client.email:
        return Response({'error': "Ce client n'a pas d'email"}, status=400)

    aujourd_hui = timezone.now().date()
    jours = (aujourd_hui - facture.date_echeance).days
    cabinet = request.user.cabinet

    sujet = 'Relance de paiement - Facture ' + facture.numero
    message = 'Madame, Monsieur ' + facture.client.nom + ',\n\n'
    message += 'Nous vous contactons au sujet de la facture N ' + facture.numero + '\n'
    message += "d'un montant de " + str(facture.montant_ttc) + ' DA TTC,\n'
    message += "dont l'echeance etait fixee au " + facture.date_echeance.strftime('%d/%m/%Y') + '.\n\n'
    message += 'A ce jour, cette facture reste impayee depuis ' + str(jours) + ' jour(s).\n\n'
    message += 'Nous vous remercions de bien vouloir proceder au reglement dans les meilleurs delais.\n\n'
    message += 'Cordialement,\n'
    message += cabinet.nom + '\n'
    message += 'Tel : ' + cabinet.telephone + '\n'
    message += 'Email : ' + cabinet.email

    try:
        send_mail(
            sujet,
            message,
            cabinet.email,
            [facture.client.email],
            fail_silently=False,
        )
        return Response({'message': 'Relance envoyee a ' + facture.client.email})
    except Exception as e:
        return Response({'error': str(e)}, status=500)


# ── Paie ────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def paie_membres(request):
    """Liste les membres du cabinet avec leur config de paie."""
    from users.models import User
    from projets.models import FeuilleDeTemps
    cabinet = request.user.cabinet
    membres = User.objects.filter(cabinet=cabinet).select_related('config_paie')

    mois = request.query_params.get('mois')
    annee = request.query_params.get('annee')

    result = []
    for m in membres:
        try:
            cfg = m.config_paie
            type_paie = cfg.type_paie
            taux = float(cfg.taux)
        except ConfigPaie.DoesNotExist:
            type_paie = 'MENSUEL'
            taux = 0

        heures_mois = 0.0
        montant_calcule = 0.0
        projets_mois = []

        if mois and annee:
            feuilles = list(FeuilleDeTemps.objects.filter(
                user=m, date__year=int(annee), date__month=int(mois)
            ).select_related('projet'))

            if type_paie == 'JOURNALIER':
                heures_mois = float(sum(f.heures for f in feuilles))
                for f in feuilles:
                    t = float(f.taux_horaire) if float(f.taux_horaire) > 0 else taux
                    montant_calcule += float(f.heures) * t

            projets_dict = {}
            for f in feuilles:
                nom = f.projet.nom
                projets_dict[nom] = projets_dict.get(nom, 0) + float(f.heures)
            projets_mois = [{'nom': k, 'heures': round(v, 1)} for k, v in projets_dict.items()]

        result.append({
            'id': m.id,
            'prenom': m.prenom,
            'nom': m.nom,
            'email': m.email,
            'is_patron': m.is_patron,
            'type_paie': type_paie,
            'taux': taux,
            'heures_mois': heures_mois,
            'montant_calcule': montant_calcule,
            'projets_mois': projets_mois,
        })
    return Response(result)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def paie_config(request, user_id):
    """Met à jour la config de paie d'un membre."""
    if not request.user.is_patron:
        return Response({'error': 'Accès réservé au patron'}, status=403)
    from users.models import User
    try:
        membre = User.objects.get(id=user_id, cabinet=request.user.cabinet)
    except User.DoesNotExist:
        return Response({'error': 'Membre introuvable'}, status=404)
    cfg, _ = ConfigPaie.objects.get_or_create(membre=membre)
    cfg.type_paie = request.data.get('type_paie', cfg.type_paie)
    cfg.taux = request.data.get('taux', cfg.taux)
    cfg.save()
    return Response({'type_paie': cfg.type_paie, 'taux': float(cfg.taux)})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def paie_fiches(request):
    cabinet = request.user.cabinet

    if request.method == 'GET':
        from projets.models import FeuilleDeTemps
        fiches = FichePaie.objects.filter(cabinet=cabinet).select_related('membre')
        data = []
        for f in fiches:
            feuilles = FeuilleDeTemps.objects.filter(
                user=f.membre, date__year=f.periode_annee, date__month=f.periode_mois
            ).select_related('projet')
            projets_dict = {}
            for ft in feuilles:
                nom = ft.projet.nom
                projets_dict[nom] = projets_dict.get(nom, 0) + float(ft.heures)
            data.append({
                'id': f.id,
                'membre_id': f.membre_id,
                'membre_nom': f.membre.prenom + ' ' + f.membre.nom,
                'periode_mois': f.periode_mois,
                'periode_annee': f.periode_annee,
                'type_paie': f.type_paie,
                'taux': float(f.taux),
                'nb_jours': float(f.nb_jours),
                'montant': float(f.montant),
                'notes': f.notes,
                'date_creation': f.date_creation,
                'projets': [{'nom': k, 'heures': round(v, 1)} for k, v in projets_dict.items()],
            })
        return Response(data)

    # POST — créer une fiche et la charge associée
    if not request.user.is_patron:
        return Response({'error': 'Accès réservé au patron'}, status=403)

    from users.models import User
    membre_id = request.data.get('membre_id')
    try:
        membre = User.objects.get(id=membre_id, cabinet=cabinet)
    except User.DoesNotExist:
        return Response({'error': 'Membre introuvable'}, status=404)

    mois = int(request.data.get('periode_mois'))
    annee = int(request.data.get('periode_annee'))
    type_paie = request.data.get('type_paie', 'MENSUEL')
    taux = Decimal(str(request.data.get('taux', 0)))
    nb_jours = Decimal(str(request.data.get('nb_jours', 0)))
    notes = request.data.get('notes', '')
    projet_id = request.data.get('projet_id') or None

    if FichePaie.objects.filter(cabinet=cabinet, membre=membre, periode_mois=mois, periode_annee=annee).exists():
        return Response({'error': 'Une fiche existe déjà pour ce membre ce mois-ci'}, status=400)

    import calendar
    date_paie = timezone.now().date().replace(day=1)
    mois_label = calendar.month_name[mois]

    # ── JOURNALIER : coût calculé depuis les feuilles de temps, pas de Charge ──
    if type_paie == 'JOURNALIER':
        from projets.models import FeuilleDeTemps
        feuilles = FeuilleDeTemps.objects.filter(user=membre, date__year=annee, date__month=mois)
        nb_jours_calc = sum(f.heures for f in feuilles)
        # taux_horaire est 0 pour les journaliers (taux réel = ConfigPaie.taux)
        montant = sum(
            f.heures * (f.taux_horaire if f.taux_horaire > 0 else taux)
            for f in feuilles
        )
        fiche = FichePaie.objects.create(
            cabinet=cabinet, membre=membre,
            periode_mois=mois, periode_annee=annee,
            type_paie=type_paie, taux=taux,
            nb_jours=nb_jours_calc, montant=montant,
            charge=None, notes=notes,
        )
        return Response({'id': fiche.id, 'montant': float(fiche.montant)}, status=201)

    # ── MENSUEL : salaire fixe, Charge globale (pas liée à un projet) ──
    montant = taux
    charge = Charge.objects.create(
        cabinet=cabinet,
        projet=None,
        categorie='SALAIRE',
        description=f'Salaire {membre.prenom} {membre.nom} — {mois_label} {annee}',
        montant=montant,
        date=date_paie,
        paye_par=request.user,
    )
    fiche = FichePaie.objects.create(
        cabinet=cabinet, membre=membre,
        periode_mois=mois, periode_annee=annee,
        type_paie=type_paie, taux=taux,
        nb_jours=0, montant=montant,
        charge=charge, notes=notes,
    )
    return Response({'id': fiche.id, 'montant': float(fiche.montant), 'charge_id': charge.id}, status=201)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def paie_fiche_detail(request, pk):
    if not request.user.is_patron:
        return Response({'error': 'Accès réservé au patron'}, status=403)
    try:
        fiche = FichePaie.objects.get(pk=pk, cabinet=request.user.cabinet)
    except FichePaie.DoesNotExist:
        return Response(status=404)
    if fiche.charge:
        fiche.charge.delete()
    fiche.delete()
    return Response(status=204)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mon_salaire(request):
    """Retourne la config de paie et les fiches du membre connecté."""
    user = request.user
    try:
        cfg = user.config_paie
        type_paie = cfg.type_paie
        taux = float(cfg.taux)
    except ConfigPaie.DoesNotExist:
        type_paie = 'MENSUEL'
        taux = 0

    from projets.models import FeuilleDeTemps
    fiches = FichePaie.objects.filter(membre=user).order_by('-periode_annee', '-periode_mois')
    fiches_data = []
    for f in fiches:
        feuilles = FeuilleDeTemps.objects.filter(
            user=user, date__year=f.periode_annee, date__month=f.periode_mois
        ).select_related('projet')
        projets_dict = {}
        for ft in feuilles:
            nom = ft.projet.nom
            projets_dict[nom] = projets_dict.get(nom, 0) + float(ft.heures)
        fiches_data.append({
            'id': f.id,
            'periode_mois': f.periode_mois,
            'periode_annee': f.periode_annee,
            'type_paie': f.type_paie,
            'taux': float(f.taux),
            'nb_jours': float(f.nb_jours),
            'montant': float(f.montant),
            'notes': f.notes,
            'date_creation': str(f.date_creation),
            'projets': [{'nom': k, 'heures': round(v, 1)} for k, v in projets_dict.items()],
        })

    return Response({
        'nom': user.prenom + ' ' + user.nom,
        'role': user.role,
        'type_paie': type_paie,
        'taux': taux,
        'fiches': fiches_data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def paie_resume(request):
    """Bénéfice net = revenus encaissés - toutes charges."""
    cabinet = request.user.cabinet
    from django.db.models import Sum
    revenus = Facture.objects.filter(cabinet=cabinet, statut='SOLDEE').aggregate(t=Sum('montant_ttc'))['t'] or 0
    charges_total = Charge.objects.filter(cabinet=cabinet).aggregate(t=Sum('montant'))['t'] or 0
    salaires = Charge.objects.filter(cabinet=cabinet, categorie='SALAIRE').aggregate(t=Sum('montant'))['t'] or 0
    autres_charges = charges_total - salaires
    benefice = revenus - charges_total
    return Response({
        'revenus': float(revenus),
        'charges_total': float(charges_total),
        'salaires': float(salaires),
        'autres_charges': float(autres_charges),
        'benefice': float(benefice),
    })
