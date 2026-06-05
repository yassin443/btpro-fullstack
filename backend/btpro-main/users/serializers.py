from rest_framework import serializers
from .models import User
from cabinets.models import Cabinet, Abonnement


class UserSerializer(serializers.ModelSerializer):
    plan = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'nom', 'prenom', 'role', 'cabinet', 'plan', 'is_patron', 'is_superuser']
        read_only_fields = ['id']

    def get_plan(self, obj):
        if obj.cabinet and hasattr(obj.cabinet, 'abonnement'):
            return obj.cabinet.abonnement.plan
        return 'SOLO'


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    plan = serializers.CharField(write_only=True, required=False, default='SOLO')
    nom_cabinet = serializers.CharField(write_only=True, required=False, default='')

    class Meta:
        model = User
        fields = ['email', 'nom', 'prenom', 'password', 'plan', 'nom_cabinet']

    def create(self, validated_data):
        plan = validated_data.pop('plan', 'SOLO')
        nom_cabinet = validated_data.pop('nom_cabinet', '')

        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            nom=validated_data['nom'],
            prenom=validated_data['prenom'],
            role='ARCHITECTE',
            is_patron=True,
        )

        cabinet = Cabinet.objects.create(
            nom=nom_cabinet or user.prenom + ' ' + user.nom + ' Architecture',
        )
        user.cabinet = cabinet
        user.save()

        Abonnement.objects.create(
            cabinet=cabinet,
            plan=plan,
            actif=False,
        )

        return user