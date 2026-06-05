from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import JournalChantier, PhotoChantier, Reserve, OrdreService, RapportTerrain
from .serializers import JournalChantierSerializer, PhotoChantierSerializer, ReserveSerializer, OrdreServiceSerializer, RapportTerrainSerializer
from projets.models import Projet


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def journaux(request, projet_pk):
    try:
        projet = Projet.objects.get(pk=projet_pk, cabinet=request.user.cabinet)
    except Projet.DoesNotExist:
        return Response({'error': 'Projet introuvable'}, status=404)
    if request.method == 'GET':
        data = JournalChantier.objects.filter(projet=projet).order_by('-date')
        return Response(JournalChantierSerializer(data, many=True).data)
    serializer = JournalChantierSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(projet=projet, redacteur=request.user)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def reserves(request, projet_pk):
    try:
        projet = Projet.objects.get(pk=projet_pk, cabinet=request.user.cabinet)
    except Projet.DoesNotExist:
        return Response({'error': 'Projet introuvable'}, status=404)
    if request.method == 'GET':
        data = Reserve.objects.filter(projet=projet)
        return Response(ReserveSerializer(data, many=True).data)
    serializer = ReserveSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(projet=projet)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def lever_reserve(request, pk):
    try:
        reserve = Reserve.objects.get(pk=pk, projet__cabinet=request.user.cabinet)
    except Reserve.DoesNotExist:
        return Response({'error': 'Réserve introuvable'}, status=404)
    reserve.statut = 'LEVEE'
    reserve.save()
    return Response(ReserveSerializer(reserve).data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def ordres_service(request, projet_pk):
    try:
        projet = Projet.objects.get(pk=projet_pk, cabinet=request.user.cabinet)
    except Projet.DoesNotExist:
        return Response({'error': 'Projet introuvable'}, status=404)
    if request.method == 'GET':
        data = OrdreService.objects.filter(projet=projet)
        return Response(OrdreServiceSerializer(data, many=True).data)
    serializer = OrdreServiceSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(projet=projet, emis_par=request.user)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ajouter_photo(request, journal_pk):
    try:
        journal = JournalChantier.objects.get(pk=journal_pk, projet__cabinet=request.user.cabinet)
    except JournalChantier.DoesNotExist:
        return Response({'error': 'Journal introuvable'}, status=404)
    image = request.FILES.get('image')
    if not image:
        return Response({'error': 'Image manquante'}, status=400)
    if image.size > 10 * 1024 * 1024:
        return Response({'error': 'Image trop volumineuse (max 10 MB)'}, status=400)
    serializer = PhotoChantierSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(journal=journal)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['DELETE', 'PATCH'])
@permission_classes([IsAuthenticated])
def supprimer_photo(request, pk):
    try:
        photo = PhotoChantier.objects.get(pk=pk, journal__projet__cabinet=request.user.cabinet)
    except PhotoChantier.DoesNotExist:
        return Response({'error': 'Photo introuvable'}, status=404)
    if request.method == 'PATCH':
        photo.legende = request.data.get('legende', photo.legende)
        photo.save()
        return Response({'id': photo.id, 'legende': photo.legende})
    photo.delete()
    return Response(status=204)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def rapports_terrain(request):
    cabinet = request.user.cabinet
    if request.method == 'GET':
        data = RapportTerrain.objects.filter(projet__cabinet=cabinet)
        return Response(RapportTerrainSerializer(data, many=True).data)
    serializer = RapportTerrainSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(redacteur=request.user)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def rapport_detail(request, pk):
    try:
        rapport = RapportTerrain.objects.get(pk=pk, projet__cabinet=request.user.cabinet)
    except RapportTerrain.DoesNotExist:
        return Response({'error': 'Rapport introuvable'}, status=404)
    if request.method == 'GET':
        return Response(RapportTerrainSerializer(rapport).data)
    if request.method == 'PUT':
        serializer = RapportTerrainSerializer(rapport, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    rapport.delete()
    return Response(status=204)