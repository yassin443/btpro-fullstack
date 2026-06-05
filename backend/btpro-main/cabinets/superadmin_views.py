from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import Cabinet, Abonnement
from users.models import User

PLAN_PRICES = {'SOLO': 4900, 'CABINET': 8900, 'AGENCE': 14900}


def _superadmin_only(request):
    return request.user.is_authenticated and request.user.is_superuser


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
            ca_mensuel += PLAN_PRICES.get(plan, 0)
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
        })

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
        cabinet.delete()
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
        return Response({'date_fin': abo.date_fin, 'actif': abo.actif})
    except Abonnement.DoesNotExist:
        return Response({'error': 'Cabinet introuvable'}, status=404)
