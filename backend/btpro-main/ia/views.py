import anthropic
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from cabinets.permissions import peut_utiliser_ia


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generer(request):
    if not peut_utiliser_ia(request.user):
        return Response({
            'error': 'Fonctionnalité réservée au plan Premium.',
            'upgrade': True
        }, status=403)

    outil = request.data.get('outil')
    contenu = request.data.get('contenu')

    if not outil or not contenu:
        return Response({'error': 'Outil et contenu requis'}, status=400)

    prompts = {
        'cctp': f"""Tu es un architecte expert algérien.
Génère un CCTP (Cahier des Clauses Techniques Particulières) professionnel
et détaillé pour le projet suivant. Utilise le format standard algérien
avec des sections claires numérotées.
Projet : {contenu}""",

        'cr': f"""Tu es un architecte expert algérien.
Génère un compte-rendu de réunion de chantier professionnel, formaté
et complet. Inclus : date, participants, points abordés, décisions prises,
actions à suivre avec responsables et délais.
Notes de réunion : {contenu}""",

        'reglementation': f"""Tu es un expert en urbanisme et réglementation
de la construction en Algérie. Réponds de façon précise et professionnelle
à cette question sur la réglementation algérienne (codes de construction,
urbanisme, POS, PDAU, normes parasismiques RPA).
Question : {contenu}"""
    }

    if outil not in prompts:
        return Response({'error': 'Outil invalide'}, status=400)

    try:
        client = anthropic.Anthropic()
        message = client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=1500,
            messages=[{'role': 'user', 'content': prompts[outil]}]
        )
        return Response({'result': message.content[0].text})
    except Exception as e:
        return Response({'error': str(e)}, status=500)