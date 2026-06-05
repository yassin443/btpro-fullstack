from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Cabinet, Abonnement, ContactMessage
from .serializers import CabinetSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mon_cabinet(request):
    cabinet = request.user.cabinet
    if not cabinet:
        return Response({'error': 'Aucun cabinet trouvé'}, status=404)
    serializer = CabinetSerializer(cabinet, context={'request': request})
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def modifier_cabinet(request):
    cabinet = request.user.cabinet
    serializer = CabinetSerializer(cabinet, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mon_abonnement(request):
    cabinet = request.user.cabinet
    if not cabinet or not hasattr(cabinet, 'abonnement'):
        return Response({'plan': 'SOLO', 'actif': False})
    abonnement = cabinet.abonnement
    from datetime import date
    date_fin = abonnement.date_fin
    is_expired = date_fin is not None and date_fin < date.today()
    return Response({
        'plan': abonnement.plan,
        'actif': abonnement.actif and not is_expired,
        'date_fin': abonnement.date_fin,
        'is_expired': is_expired,
    })


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def changer_plan(request):
    if not request.user.is_patron:
        return Response({'error': 'Seul le propriétaire peut changer de plan'}, status=403)

    cabinet = request.user.cabinet
    if not cabinet:
        return Response({'error': 'Pas de cabinet'}, status=400)

    nouveau_plan = request.data.get('plan')
    if nouveau_plan not in ['SOLO', 'CABINET', 'AGENCE']:
        return Response({'error': 'Plan invalide'}, status=400)

    from users.models import User
    nb_membres = User.objects.filter(cabinet=cabinet).count()

    if nouveau_plan == 'SOLO' and nb_membres > 1:
        return Response({
            'error': 'Vous avez ' + str(nb_membres) + ' membres. Supprimez les membres en trop avant de passer au plan Solo (1 utilisateur max).'
        }, status=400)

    if nouveau_plan == 'CABINET' and nb_membres > 5:
        return Response({
            'error': 'Vous avez ' + str(nb_membres) + ' membres. Supprimez les membres en trop avant de passer au plan Cabinet (5 utilisateurs max).'
        }, status=400)

    abonnement = cabinet.abonnement
    abonnement.plan = nouveau_plan
    abonnement.save()
    return Response({'plan': nouveau_plan, 'message': 'Plan mis à jour'})


@api_view(['POST'])
@permission_classes([AllowAny])
def contact_message(request):
    data = request.data
    nom = data.get('nom', '').strip()
    email = data.get('email', '').strip()
    message = data.get('message', '').strip()
    if not nom or not email or not message:
        return Response({'error': 'Nom, email et message requis'}, status=400)

    sujet = data.get('sujet', 'AUTRE')
    cabinet_nom = data.get('cabinet', '').strip()
    telephone = data.get('telephone', '').strip()

    msg = ContactMessage.objects.create(
        nom=nom, email=email, message=message,
        sujet=sujet, cabinet=cabinet_nom, telephone=telephone
    )

    import threading
    from django.core.mail import send_mail as _send_mail
    from django.conf import settings

    def _send():
        try:
            sujet_label = dict(ContactMessage.SUBJECTS).get(sujet, sujet)
            _send_mail(
                subject=f'[Planner] {sujet_label} — {nom}',
                message=f'Nom: {nom}\nCabinet: {cabinet_nom}\nEmail: {email}\nTéléphone: {telephone}\nSujet: {sujet_label}\n\n{message}',
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@planner.dz'),
                recipient_list=[getattr(settings, 'CONTACT_EMAIL', 'djbarcausma@gmail.com')],
                fail_silently=True,
            )
        except Exception:
            pass

    threading.Thread(target=_send, daemon=True).start()

    return Response({'success': True, 'id': msg.id}, status=201)


@api_view(['GET'])
@permission_classes([AllowAny])
def stats_publiques(request):
    from projets.models import Projet
    from users.models import User
    nb_cabinets = Cabinet.objects.count()
    nb_projets = Projet.objects.count()
    nb_architectes = User.objects.filter(is_active=True).count()
    return Response({
        'nb_cabinets': nb_cabinets,
        'nb_projets': nb_projets,
        'nb_architectes': nb_architectes,
    })