import hmac
import hashlib
import json
from datetime import date, timedelta

import requests as http_requests
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from cabinets.models import Abonnement

CHARGILY_API_URL = 'https://pay.chargily.net/test/api/v2'
PLAN_PRICES = {'SOLO': 4900, 'CABINET': 8900, 'AGENCE': 14900}
PLAN_LABELS = {'SOLO': 'Solo', 'CABINET': 'Cabinet', 'AGENCE': 'Agence'}
PLAN_LIMITS = {
    'SOLO':    {'users': 1,  'storage_gb': 5},
    'CABINET': {'users': 3,  'storage_gb': 10},
    'AGENCE':  {'users': 5,  'storage_gb': 15},
}


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_checkout(request):
    plan = request.data.get('plan')
    if plan not in PLAN_PRICES:
        return Response({'error': 'Plan invalide'}, status=400)

    from users.models import User as UserModel
    fresh_user = UserModel.objects.select_related('cabinet').get(pk=request.user.pk)
    cabinet = fresh_user.cabinet
    if not cabinet:
        return Response({'error': 'Pas de cabinet'}, status=400)

    if not fresh_user.is_patron:
        return Response({'error': 'Seul le propriétaire peut gérer le paiement'}, status=403)

    try:
        abo = cabinet.abonnement
        if abo.actif and abo.date_fin and abo.date_fin > date.today():
            return Response({'error': f'Votre abonnement est actif jusqu\'au {abo.date_fin.strftime("%d/%m/%Y")}. Vous pourrez renouveler à partir de cette date.'}, status=400)
    except Exception:
        pass

    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    backend_url = getattr(settings, 'BACKEND_URL', 'http://localhost:8000')

    # Tarif depuis PlanConfig (éditable) avec repli sur PLAN_PRICES
    amount = PLAN_PRICES[plan]
    try:
        from cabinets.models import PlanConfig
        pc = PlanConfig.objects.filter(code=plan).first()
        if pc and pc.prix:
            amount = int(pc.prix)
    except Exception:
        pass

    payload = {
        'amount': amount,
        'currency': 'dzd',
        'success_url': f'{frontend_url}/payment/success',
        'failure_url': f'{frontend_url}/payment/failed',
        'webhook_endpoint': f'{backend_url}/api/finances/webhook/',
        'description': f'Abonnement BTPro — Plan {PLAN_LABELS[plan]}',
        'locale': 'fr',
        'metadata': {
            'cabinet_id': cabinet.id,
            'plan': plan,
        },
    }

    try:
        r = http_requests.post(
            f'{CHARGILY_API_URL}/checkouts',
            json=payload,
            headers={
                'Authorization': f'Bearer {settings.CHARGILY_API_SECRET}',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            timeout=10,
        )
    except http_requests.RequestException:
        return Response({'error': 'Impossible de contacter Chargily'}, status=503)

    if r.status_code not in (200, 201):
        print('CHARGILY ERROR:', r.status_code, r.text)
        print('KEY USED:', settings.CHARGILY_API_SECRET[:15] if settings.CHARGILY_API_SECRET else 'VIDE')
        return Response({'error': 'Erreur Chargily', 'detail': r.text}, status=400)

    return Response({'checkout_url': r.json().get('checkout_url')})


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def webhook(request):
    secret = getattr(settings, 'CHARGILY_API_SECRET', '')
    if not secret:
        return Response({'error': 'Webhook non configuré'}, status=503)

    signature = request.headers.get('signature', '')
    expected = hmac.new(
        secret.encode(), request.body, digestmod=hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(expected, signature):
        return Response({'error': 'Signature invalide'}, status=403)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return Response({'error': 'JSON invalide'}, status=400)

    event_type = data.get('type')

    if event_type == 'checkout.paid':
        checkout = data.get('data', {})
        metadata = checkout.get('metadata', {})
        cabinet_id = metadata.get('cabinet_id')
        plan = metadata.get('plan')

        if cabinet_id and plan in PLAN_PRICES:
            try:
                abo = Abonnement.objects.get(cabinet_id=cabinet_id)
                abo.plan = plan
                abo.actif = True
                base = abo.date_fin if (abo.date_fin and abo.date_fin > date.today()) else date.today()
                abo.date_fin = base + timedelta(days=30)
                abo.save()
            except Abonnement.DoesNotExist:
                pass

    return Response({'status': 'ok'})
