import requests as http_requests
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import UserSerializer, RegisterSerializer


class LoginRateThrottle(AnonRateThrottle):
    rate = '5/min'


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([LoginRateThrottle])
def login(request):
    email = request.data.get('email')
    password = request.data.get('password')
    try:
        user = User.objects.get(email=email)
        if user.check_password(password):
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            })
        else:
            return Response({'error': 'Email ou mot de passe incorrect'}, status=status.HTTP_401_UNAUTHORIZED)
    except User.DoesNotExist:
        return Response({'error': 'Email ou mot de passe incorrect'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def me(request):
    if request.method == 'PATCH':
        allowed = {k: v for k, v in request.data.items() if k in ('prenom', 'nom')}
        for field, value in allowed.items():
            setattr(request.user, field, value)
        request.user.save(update_fields=list(allowed.keys()))
        return Response(UserSerializer(request.user).data)
    return Response(UserSerializer(request.user).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        token = RefreshToken(request.data.get('refresh'))
        token.blacklist()
        return Response({'message': 'Déconnecté'})
    except Exception:
        return Response({'error': 'Token invalide'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def membres(request):
    cabinet = request.user.cabinet
    if not cabinet:
        return Response({'error': 'Pas de cabinet'}, status=400)

    if request.method == 'GET':
        data = User.objects.filter(cabinet=cabinet)
        return Response(UserSerializer(data, many=True).data)

    if not request.user.is_patron:
        return Response({'error': 'Seul le propriétaire du cabinet peut ajouter des membres'}, status=403)

    from cabinets.permissions import peut_ajouter_membre
    if not peut_ajouter_membre(request.user):
        from cabinets.permissions import get_plan
        plan = get_plan(request.user)
        if plan == 'SOLO':
            msg = 'Plan Solo limité à 1 utilisateur. Passez au plan Cabinet.'
        elif plan == 'CABINET':
            msg = 'Plan Cabinet limité à 5 utilisateurs. Passez au plan Premium.'
        else:
            msg = 'Limite atteinte.'
        return Response({'error': msg}, status=403)

    email = request.data.get('email')
    password = request.data.get('password')
    nom = request.data.get('nom')
    prenom = request.data.get('prenom')

    if not email or not password or not nom or not prenom:
        return Response({'error': 'Tous les champs sont obligatoires'}, status=400)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'Cet email existe déjà'}, status=400)

    is_associe = request.data.get('is_associe', False)
    user = User.objects.create_user(
        email=email,
        password=password,
        nom=nom,
        prenom=prenom,
        role='ARCHITECTE',
        is_patron=bool(is_associe),
        cabinet=cabinet
    )
    return Response(UserSerializer(user).data, status=201)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def supprimer_membre(request, pk):
    if not request.user.is_patron:
        return Response({'error': 'Seul un associé peut supprimer des membres'}, status=403)
    try:
        membre = User.objects.get(pk=pk, cabinet=request.user.cabinet)
    except User.DoesNotExist:
        return Response({'error': 'Membre introuvable'}, status=404)
    if membre.id == request.user.id:
        return Response({'error': 'Vous ne pouvez pas vous supprimer'}, status=400)
    membre.delete()
    return Response({'message': 'Supprimé'}, status=204)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def toggle_associe(request, pk):
    if not request.user.is_patron:
        return Response({'error': 'Seul un associé peut modifier ce statut'}, status=403)
    try:
        membre = User.objects.get(pk=pk, cabinet=request.user.cabinet)
    except User.DoesNotExist:
        return Response({'error': 'Membre introuvable'}, status=404)
    if membre.id == request.user.id:
        return Response({'error': 'Vous ne pouvez pas modifier votre propre statut'}, status=400)
    # Prevent removing the last associé
    if membre.is_patron:
        nb_associes = User.objects.filter(cabinet=request.user.cabinet, is_patron=True).count()
        if nb_associes <= 1:
            return Response({'error': 'Le cabinet doit avoir au moins un associé'}, status=400)
        membre.is_patron = False
    else:
        membre.is_patron = True
    membre.save(update_fields=['is_patron'])
    return Response(UserSerializer(membre).data)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    from cabinets.models import Cabinet, Abonnement

    access_token = request.data.get('access_token')
    plan = request.data.get('plan', 'SOLO')
    nom_cabinet = request.data.get('nom_cabinet', '')

    if not access_token:
        return Response({'error': 'Token Google manquant'}, status=400)

    # Verify token and get user info from Google
    r = http_requests.get(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        headers={'Authorization': f'Bearer {access_token}'},
        timeout=5,
    )
    if r.status_code != 200:
        return Response({'error': 'Token Google invalide'}, status=400)

    google_user = r.json()
    email = google_user.get('email')
    prenom = google_user.get('given_name', '')
    nom = google_user.get('family_name', '')

    if not email:
        return Response({'error': 'Email Google manquant'}, status=400)
    if not google_user.get('email_verified'):
        return Response({'error': 'Email Google non vérifié'}, status=400)

    try:
        user = User.objects.get(email=email)
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })
    except User.DoesNotExist:
        if not nom_cabinet:
            # Frontend needs to collect cabinet info
            return Response(
                {'action': 'new_user', 'email': email, 'prenom': prenom, 'nom': nom},
                status=202,
            )

        cabinet = Cabinet.objects.create(
            nom=nom_cabinet or f'{prenom} {nom} Architecture'.strip(),
        )
        Abonnement.objects.create(cabinet=cabinet, plan=plan, actif=False)
        user = User.objects.create_user(
            email=email,
            password=None,
            nom=nom or email.split('@')[0],
            prenom=prenom or '',
            role='ARCHITECTE',
            is_patron=True,
        )
        user.cabinet = cabinet
        user.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=201)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def reset_password_membre(request, pk):
    if not request.user.is_patron:
        return Response({'error': 'Seul le propriétaire peut réinitialiser les mots de passe'}, status=403)
    try:
        membre = User.objects.get(pk=pk, cabinet=request.user.cabinet)
    except User.DoesNotExist:
        return Response({'error': 'Membre introuvable'}, status=404)
    new_password = request.data.get('password')
    if not new_password:
        return Response({'error': 'Mot de passe obligatoire'}, status=400)
    membre.set_password(new_password)
    membre.save()
    return Response({'message': 'Mot de passe réinitialisé'})