import mimetypes
from django.http import FileResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Document, Version
from .serializers import DocumentSerializer, VersionSerializer
from projets.models import Projet


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def documents(request, projet_pk):
    try:
        projet = Projet.objects.get(pk=projet_pk, cabinet=request.user.cabinet)
    except Projet.DoesNotExist:
        return Response({'error': 'Projet introuvable'}, status=404)

    if request.method == 'GET':
        data = Document.objects.filter(projet=projet)
        return Response(DocumentSerializer(data, many=True).data)

    nom = request.data.get('nom', '')
    type_document = request.data.get('type_document', 'AUTRE')
    description = request.data.get('description', '')
    fichier = request.FILES.get('fichier')

    if not nom:
        return Response({'error': 'Le nom est obligatoire'}, status=400)

    doc = Document.objects.create(
        projet=projet,
        nom=nom,
        type_document=type_document,
        description=description,
        uploade_par=request.user
    )

    if fichier:
        Version.objects.create(
            document=doc,
            numero_version=1,
            fichier=fichier,
            taille=fichier.size,
            commentaire='Version initiale',
            uploade_par=request.user
        )

    return Response(DocumentSerializer(doc).data, status=201)


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def document_detail(request, pk):
    try:
        doc = Document.objects.get(pk=pk, projet__cabinet=request.user.cabinet)
    except Document.DoesNotExist:
        return Response({'error': 'Document introuvable'}, status=404)
    if request.method == 'GET':
        return Response(DocumentSerializer(doc).data)
    doc.delete()
    return Response(status=204)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ajouter_version(request, document_pk):
    try:
        doc = Document.objects.get(pk=document_pk, projet__cabinet=request.user.cabinet)
    except Document.DoesNotExist:
        return Response({'error': 'Document introuvable'}, status=404)

    fichier = request.FILES.get('fichier')
    if not fichier:
        return Response({'error': 'Fichier obligatoire'}, status=400)

    derniere = doc.versions.first()
    numero = (derniere.numero_version + 1) if derniere else 1

    version = Version.objects.create(
        document=doc,
        numero_version=numero,
        fichier=fichier,
        taille=fichier.size,
        commentaire=request.data.get('commentaire', ''),
        uploade_par=request.user
    )
    return Response(VersionSerializer(version).data, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def telecharger_version(request, pk):
    try:
        version = Version.objects.get(pk=pk, document__projet__cabinet=request.user.cabinet)
    except Version.DoesNotExist:
        return Response({'error': 'Fichier introuvable'}, status=404)
    filename = version.fichier.name.split('/')[-1]
    content_type, _ = mimetypes.guess_type(filename)
    response = FileResponse(version.fichier.open('rb'), content_type=content_type or 'application/octet-stream')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response