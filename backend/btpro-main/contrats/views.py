import base64
import os
from io import BytesIO
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from xhtml2pdf import pisa

from .models import Contrat, MISSIONS_DICT
from .serializers import ContratSerializer


# ── helpers ────────────────────────────────────────────────────────────────

def _f(n):
    return '{:,.0f}'.format(n).replace(',', ' ')


def _logo_b64(cabinet):
    if cabinet.logo and cabinet.logo.name:
        try:
            with open(cabinet.logo.path, 'rb') as f:
                raw = base64.b64encode(f.read()).decode()
            ext = os.path.splitext(cabinet.logo.name)[1].lower().strip('.')
            mime = {'png': 'png', 'jpg': 'jpeg', 'jpeg': 'jpeg'}.get(ext, 'png')
            return f'<img src="data:image/{mime};base64,{raw}" style="height:48px;max-width:130px;display:block;margin-bottom:8px;" />'
        except Exception:
            pass
    return ''


def _coord(label, value):
    if not value:
        return ''
    return f'<tr><td style="padding:2px 0;font-size:11px;color:#64748B;width:80px;">{label}</td><td style="padding:2px 0;font-size:11px;color:#1E293B;font-weight:600;">: {value}</td></tr>'


def _render_pdf(html):
    buf = BytesIO()
    pisa.CreatePDF(html, dest=buf)
    response = HttpResponse(buf.getvalue(), content_type='application/pdf')
    return response


# ── CRUD ───────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def contrats(request):
    cabinet = request.user.cabinet
    if request.method == 'GET':
        qs = Contrat.objects.filter(cabinet=cabinet).select_related('projet', 'client', 'contrat_parent')
        projet_id = request.query_params.get('projet')
        if projet_id:
            qs = qs.filter(projet_id=projet_id)
        return Response(ContratSerializer(qs, many=True).data)

    serializer = ContratSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(cabinet=cabinet)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def contrat_detail(request, pk):
    try:
        c = Contrat.objects.get(pk=pk, cabinet=request.user.cabinet)
    except Contrat.DoesNotExist:
        return Response({'error': 'Contrat introuvable'}, status=404)

    if request.method == 'GET':
        return Response(ContratSerializer(c).data)
    if request.method == 'PUT':
        s = ContratSerializer(c, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return Response(s.data)
        return Response(s.errors, status=400)
    c.delete()
    return Response(status=204)


# ── PDF CONTRAT ─────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def contrat_pdf(request, pk):
    try:
        contrat = Contrat.objects.get(pk=pk, cabinet=request.user.cabinet)
    except Contrat.DoesNotExist:
        return Response({'error': 'Contrat introuvable'}, status=404)

    cab = request.user.cabinet
    cl  = contrat.client
    is_avenant = contrat.type == 'AVENANT'

    titre   = 'AVENANT' if is_avenant else "CONTRAT DE MAÎTRISE D'ŒUVRE"
    accent  = '#7C3AED' if is_avenant else '#6366F1'
    numero_display = contrat.numero

    tva_montant = contrat.montant_ttc - contrat.montant_ht

    # parent info (for avenant)
    parent_block = ''
    if is_avenant and contrat.contrat_parent:
        parent_block = f'''
<table style="width:100%;border-collapse:collapse;"><tr><td style="padding:0 28px 14px;">
<table style="width:100%;border-collapse:collapse;border-left:3px solid {accent};background:#F8FAFC;">
  <tr><td style="padding:10px 16px;font-size:11px;color:#64748B;">
    <strong style="font-size:9px;color:{accent};display:block;margin-bottom:3px;font-weight:800;letter-spacing:0.6px;">AVENANT AU CONTRAT</strong>
    N° {contrat.contrat_parent.numero} — {contrat.contrat_parent.projet.nom}
  </td></tr>
</table>
</td></tr></table>'''

    # missions rows
    missions_rows = ''
    if contrat.missions:
        for m in contrat.missions:
            label = MISSIONS_DICT.get(m, m)
            missions_rows += f'''
<tr>
  <td style="padding:8px 14px;font-size:11px;color:#374151;border-bottom:1px solid #F1F5F9;width:80px;font-weight:700;color:{accent};">{m}</td>
  <td style="padding:8px 14px;font-size:11px;color:#374151;border-bottom:1px solid #F1F5F9;">{label}</td>
  <td style="padding:8px 14px;font-size:11px;text-align:center;border-bottom:1px solid #F1F5F9;">
    <span style="display:inline-block;width:16px;height:16px;border-radius:4px;background:{accent};color:white;font-size:9px;font-weight:900;line-height:16px;text-align:center;">✓</span>
  </td>
</tr>'''

    missions_block = ''
    if missions_rows and not is_avenant:
        missions_block = f'''
<table style="width:100%;border-collapse:collapse;margin-bottom:4px;"><tr><td style="padding:0 28px;">
  <div style="font-size:9px;font-weight:800;color:{accent};letter-spacing:0.8px;text-transform:uppercase;margin-bottom:6px;">ARTICLE 2 — MISSIONS CONFIÉES</div>
  <table style="width:100%;border-collapse:collapse;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;">
    <tr style="background:#F8FAFC;">
      <th style="padding:8px 14px;text-align:left;font-size:9px;font-weight:700;color:#94A3B8;width:80px;">CODE</th>
      <th style="padding:8px 14px;text-align:left;font-size:9px;font-weight:700;color:#94A3B8;">DÉSIGNATION DE LA MISSION</th>
      <th style="padding:8px 14px;text-align:center;font-size:9px;font-weight:700;color:#94A3B8;width:60px;">INCLUSE</th>
    </tr>
    {missions_rows}
  </table>
</td></tr></table>'''

    # dates
    dd = contrat.date_debut.strftime('%d/%m/%Y')    if contrat.date_debut else '—'
    df = contrat.date_fin.strftime('%d/%m/%Y')      if contrat.date_fin    else '—'
    ds = contrat.date_signature.strftime('%d/%m/%Y') if contrat.date_signature else '—'
    dc = contrat.date_creation.strftime('%d/%m/%Y')

    art_num = 2 if is_avenant else 3

    notes_block = ''
    if contrat.notes:
        notes_block = f'''
<table style="width:100%;border-collapse:collapse;"><tr><td style="padding:0 28px 14px;">
  <div style="font-size:9px;font-weight:800;color:{accent};letter-spacing:0.8px;text-transform:uppercase;margin-bottom:6px;">ARTICLE {art_num + 2} — CLAUSES PARTICULIÈRES</div>
  <table style="width:100%;border-collapse:collapse;border-left:3px solid {accent};background:#FAFAFA;">
    <tr><td style="padding:12px 16px;font-size:11px;color:#374151;line-height:1.8;">{contrat.notes}</td></tr>
  </table>
</td></tr></table>'''

    html = f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
@page {{ size: A4 portrait; margin: 0; }}
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ font-family: Helvetica, Arial, sans-serif; background:#fff; color:#1E293B; font-size:12px; }}
</style>
</head><body>

<!-- ══ HEADER ══ -->
<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="background:#0F172A;padding:26px 28px;width:50%;vertical-align:top;border-bottom:4px solid {accent};">
      {_logo_b64(cab)}
      <div style="font-size:20px;font-weight:900;color:{accent};letter-spacing:-0.5px;line-height:1.1;">{cab.nom}</div>
      <div style="font-size:10px;color:#64748B;margin-top:3px;">{cab.activite or "Cabinet d'Architecture"}</div>
    </td>
    <td style="background:#0F172A;padding:26px 28px;width:50%;vertical-align:middle;text-align:right;border-bottom:4px solid {accent};">
      <div style="font-size:{'22' if is_avenant else '17'}px;font-weight:900;color:#fff;letter-spacing:-0.5px;line-height:1.2;">{titre}</div>
      <div style="font-size:14px;color:{accent};font-weight:700;margin-top:5px;">N° {numero_display}</div>
      <div style="font-size:10px;color:#475569;margin-top:4px;">Établi le {dc}</div>
    </td>
  </tr>
</table>

<!-- ══ STATUT STRIP ══ -->
<table style="width:100%;border-collapse:collapse;">
  <tr style="background:#F8FAFC;border-bottom:1px solid #E2E8F0;">
    <td style="padding:10px 28px;">
      <table style="border-collapse:collapse;">
        <tr>
          <td style="padding-right:32px;font-size:10px;color:#64748B;">Statut&nbsp;&nbsp;<strong style="color:#0F172A;">{dict(Contrat.STATUTS).get(contrat.statut, contrat.statut)}</strong></td>
          <td style="padding-right:32px;font-size:10px;color:#64748B;">Date début&nbsp;&nbsp;<strong style="color:#0F172A;">{dd}</strong></td>
          <td style="padding-right:32px;font-size:10px;color:#64748B;">Date fin&nbsp;&nbsp;<strong style="color:#0F172A;">{df}</strong></td>
          <td style="font-size:10px;color:#64748B;">Date signature&nbsp;&nbsp;<strong style="color:#0F172A;">{ds}</strong></td>
        </tr>
      </table>
    </td>
  </tr>
</table>

{parent_block}

<!-- ══ PARTIES ══ -->
<table style="width:100%;border-collapse:collapse;"><tr><td style="padding:16px 28px 14px;">
<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="background:#F1F5F9;padding:5px 14px;font-size:9px;font-weight:800;color:#64748B;letter-spacing:0.6px;" colspan="3">PARTIES AU CONTRAT</td>
  </tr>
  <tr>
    <td style="width:48%;vertical-align:top;border:1px solid #E2E8F0;padding:14px 16px;">
      <div style="font-size:9px;font-weight:800;color:{accent};letter-spacing:0.6px;margin-bottom:8px;">MAÎTRE D'OUVRAGE</div>
      <div style="font-size:13px;font-weight:800;color:#0F172A;margin-bottom:8px;">{cl.nom}</div>
      <table style="border-collapse:collapse;">
        {_coord('Adresse', cl.adresse)}
        {_coord('Contact', cl.contact_nom)}
        {_coord('Tél', cl.telephone)}
        {_coord('Email', cl.email)}
        {_coord('RC', cl.numero_rc)}
        {_coord('NIF', cl.nif)}
        {_coord('AI', cl.ai)}
        {_coord('NIS', cl.nis)}
      </table>
    </td>
    <td style="width:4%;"></td>
    <td style="width:48%;vertical-align:top;border:1px solid #E2E8F0;padding:14px 16px;">
      <div style="font-size:9px;font-weight:800;color:{accent};letter-spacing:0.6px;margin-bottom:8px;">MAÎTRE D'ŒUVRE</div>
      <div style="font-size:13px;font-weight:800;color:#0F172A;margin-bottom:8px;">{cab.nom}</div>
      <table style="border-collapse:collapse;">
        {_coord('Adresse', cab.adresse)}
        {_coord('Tél', cab.telephone)}
        {_coord('Email', cab.email)}
        {_coord('RC', cab.numero_rc)}
        {_coord('NIF', cab.nif)}
        {_coord('AI', cab.ai)}
        {_coord('NIS', cab.nis)}
      </table>
    </td>
  </tr>
</table>
</td></tr></table>

<!-- ══ ARTICLE 1 : OBJET ══ -->
<table style="width:100%;border-collapse:collapse;"><tr><td style="padding:0 28px 14px;">
  <div style="font-size:9px;font-weight:800;color:{accent};letter-spacing:0.8px;text-transform:uppercase;margin-bottom:6px;">ARTICLE 1 — OBJET DU {'CONTRAT' if not is_avenant else "AVENANT"}</div>
  <table style="width:100%;border-collapse:collapse;border:1px solid #E2E8F0;">
    <tr><td style="padding:5px 10px;font-size:9px;font-weight:700;color:#64748B;background:#F8FAFC;border-bottom:1px solid #E2E8F0;">PROJET</td>
        <td style="padding:5px 10px;font-size:11px;font-weight:700;color:#0F172A;background:#F8FAFC;border-bottom:1px solid #E2E8F0;">{contrat.projet.nom}</td></tr>
    <tr><td style="padding:5px 10px;font-size:9px;font-weight:700;color:#64748B;border-bottom:1px solid #E2E8F0;">ADRESSE</td>
        <td style="padding:5px 10px;font-size:11px;color:#374151;border-bottom:1px solid #E2E8F0;">{contrat.projet.adresse_chantier or '—'}</td></tr>
    <tr><td style="padding:10px 10px;font-size:9px;font-weight:700;color:#64748B;vertical-align:top;">OBJET</td>
        <td style="padding:10px 10px;font-size:11px;color:#374151;line-height:1.7;">{contrat.objet}</td></tr>
  </table>
</td></tr></table>

{missions_block}

<!-- ══ ARTICLE HONORAIRES ══ -->
<table style="width:100%;border-collapse:collapse;"><tr><td style="padding:0 28px 14px;">
  <div style="font-size:9px;font-weight:800;color:{accent};letter-spacing:0.8px;text-transform:uppercase;margin-bottom:6px;">ARTICLE {art_num} — HONORAIRES</div>
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="width:55%;"></td>
      <td style="width:45%;vertical-align:top;">
        <table style="width:100%;border-collapse:collapse;">
          {'<tr><td style="padding:8px 14px;font-size:12px;color:#64748B;border-bottom:1px solid #F1F5F9;">Montant HT</td><td style="padding:8px 14px;font-size:12px;color:#374151;font-weight:600;text-align:right;border-bottom:1px solid #F1F5F9;width:140px;">' + _f(contrat.montant_ht) + '&nbsp;DA</td></tr>' if contrat.tva > 0 else ''}
          {'<tr><td style="padding:8px 14px;font-size:12px;color:#64748B;border-bottom:1px solid #F1F5F9;">TVA (' + str(contrat.tva) + '%)</td><td style="padding:8px 14px;font-size:12px;color:#374151;font-weight:600;text-align:right;border-bottom:1px solid #F1F5F9;">' + _f(tva_montant) + '&nbsp;DA</td></tr>' if contrat.tva > 0 else '<tr><td colspan="2" style="padding:6px 14px;font-size:10px;color:#64748B;font-style:italic;border-bottom:1px solid #F1F5F9;">Non assujetti à la TVA</td></tr>'}
          <tr><td style="padding:10px 14px;font-size:13px;font-weight:700;color:#fff;background:#0F172A;">Total</td>
              <td style="padding:10px 14px;font-size:13px;font-weight:800;color:#fff;background:#0F172A;text-align:right;">{_f(contrat.montant_ttc)}&nbsp;DA</td></tr>
        </table>
      </td>
    </tr>
  </table>
</td></tr></table>

{notes_block}

<!-- ══ SIGNATURES ══ -->
<table style="width:100%;border-collapse:collapse;"><tr><td style="padding:0 28px 28px;">
  <div style="font-size:9px;font-weight:800;color:{accent};letter-spacing:0.8px;text-transform:uppercase;margin-bottom:10px;border-top:1px solid #E2E8F0;padding-top:14px;">SIGNATURES</div>
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="width:47%;border:1px solid #E2E8F0;padding:16px;vertical-align:top;">
        <div style="font-size:9px;font-weight:700;color:#64748B;margin-bottom:4px;">LE MAÎTRE D'OUVRAGE</div>
        <div style="font-size:11px;font-weight:700;color:#0F172A;margin-bottom:12px;">{cl.nom}</div>
        <div style="font-size:10px;color:#94A3B8;margin-bottom:4px;">Date : ____________________</div>
        <div style="height:50px;border-bottom:1px dashed #CBD5E1;margin-top:8px;"></div>
        <div style="font-size:9px;color:#94A3B8;margin-top:4px;text-align:center;">Cachet et signature</div>
      </td>
      <td style="width:6%;"></td>
      <td style="width:47%;border:1px solid #E2E8F0;padding:16px;vertical-align:top;">
        <div style="font-size:9px;font-weight:700;color:#64748B;margin-bottom:4px;">LE MAÎTRE D'ŒUVRE</div>
        <div style="font-size:11px;font-weight:700;color:#0F172A;margin-bottom:12px;">{cab.nom}</div>
        <div style="font-size:10px;color:#94A3B8;margin-bottom:4px;">Date : ____________________</div>
        <div style="height:50px;border-bottom:1px dashed #CBD5E1;margin-top:8px;"></div>
        <div style="font-size:9px;color:#94A3B8;margin-top:4px;text-align:center;">Cachet et signature</div>
      </td>
    </tr>
  </table>
</td></tr></table>

<!-- ══ FOOTER ══ -->
<table style="width:100%;border-collapse:collapse;"><tr>
  <td style="padding:10px 28px;text-align:center;font-size:9px;color:#CBD5E1;border-top:1px solid #F1F5F9;">
    Document généré par BTPro &nbsp;·&nbsp; {cab.nom} &nbsp;·&nbsp; {dc}
  </td>
</tr></table>

</body></html>"""

    response = _render_pdf(html)
    response['Content-Disposition'] = f'attachment; filename="{contrat.numero}.pdf"'
    return response
