from rest_framework import serializers
from .models import Cabinet, Abonnement


class AbonnementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Abonnement
        fields = ['id', 'plan', 'date_debut', 'date_fin', 'actif']


class CabinetSerializer(serializers.ModelSerializer):
    abonnement = AbonnementSerializer(read_only=True)

    class Meta:
        model = Cabinet
        fields = ['id', 'nom', 'activite', 'adresse', 'wilaya', 'telephone', 'email',
                  'logo', 'numero_rc', 'nif', 'ai', 'nis', 'assujetti_tva', 'abonnement', 'updated_at']
        read_only_fields = ['updated_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        logo = data.get('logo')
        if logo and request and not logo.startswith('http'):
            data['logo'] = request.build_absolute_uri(logo)
        return data