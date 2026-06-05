from decimal import Decimal
from django.db import transaction
from rest_framework import serializers
from .models import Devis, Facture, Paiement, Charge, LigneDevis, LigneFacture


class PaiementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paiement
        fields = ['id', 'montant', 'mode', 'date_paiement', 'reference', 'notes']


class LigneDevisSerializer(serializers.ModelSerializer):
    total_ht  = serializers.SerializerMethodField()
    total_ttc = serializers.SerializerMethodField()

    class Meta:
        model = LigneDevis
        fields = ['id', 'designation', 'quantite', 'prix_unitaire', 'tva', 'ordre', 'total_ht', 'total_ttc']

    def get_total_ht(self, obj):
        return float(obj.quantite * obj.prix_unitaire)

    def get_total_ttc(self, obj):
        ht = obj.quantite * obj.prix_unitaire
        return float(ht * (1 + obj.tva / 100))


class LigneFactureSerializer(serializers.ModelSerializer):
    total_ht  = serializers.SerializerMethodField()
    total_ttc = serializers.SerializerMethodField()

    class Meta:
        model = LigneFacture
        fields = ['id', 'designation', 'quantite', 'prix_unitaire', 'tva', 'ordre', 'total_ht', 'total_ttc']

    def get_total_ht(self, obj):
        return float(obj.quantite * obj.prix_unitaire)

    def get_total_ttc(self, obj):
        ht = obj.quantite * obj.prix_unitaire
        return float(ht * (1 + obj.tva / 100))


def _compute_totals(lignes_data, remise):
    """Calcule montant_ht et montant_ttc depuis les lignes."""
    total_ht = sum(
        Decimal(str(l.get('quantite', 1))) * Decimal(str(l.get('prix_unitaire', 0)))
        for l in lignes_data
    )
    remise_d = Decimal(str(remise or 0))
    total_ht_remise = total_ht * (1 - remise_d / 100)
    # TVA mixte : on calcule ligne par ligne
    total_ttc = Decimal('0')
    for l in lignes_data:
        ht_ligne = Decimal(str(l.get('quantite', 1))) * Decimal(str(l.get('prix_unitaire', 0)))
        tva = Decimal(str(l.get('tva', 19)))
        ttc_ligne = ht_ligne * (1 + tva / 100)
        total_ttc += ttc_ligne
    # Appliquer remise proportionnellement au TTC aussi
    total_ttc_remise = total_ttc * (1 - remise_d / 100)
    return total_ht_remise, total_ttc_remise


class DevisSerializer(serializers.ModelSerializer):
    lignes     = LigneDevisSerializer(many=True, required=False)
    client_nom = serializers.SerializerMethodField()
    projet_nom = serializers.SerializerMethodField()

    class Meta:
        model = Devis
        fields = [
            'id', 'cabinet', 'client', 'projet', 'numero', 'statut',
            'montant_ht', 'montant_ttc', 'remise',
            'date_emission', 'date_validite',
            'conditions_paiement', 'rib', 'mentions_legales', 'notes',
            'client_nom', 'projet_nom', 'lignes',
        ]
        read_only_fields = ['cabinet', 'numero', 'montant_ht', 'montant_ttc']

    def get_client_nom(self, obj):
        return obj.client.nom if obj.client else ''

    def get_projet_nom(self, obj):
        return obj.projet.nom if obj.projet else ''

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes', [])
        remise = validated_data.get('remise', 0)
        ht, ttc = _compute_totals(lignes_data, remise)
        validated_data['montant_ht'] = ht
        validated_data['montant_ttc'] = ttc
        with transaction.atomic():
            devis = Devis.objects.create(**validated_data)
            for i, l in enumerate(lignes_data):
                ligne = {k: v for k, v in l.items() if k != 'ordre'}
                LigneDevis.objects.create(devis=devis, ordre=i + 1, **ligne)
        return devis

    def update(self, instance, validated_data):
        lignes_data = validated_data.pop('lignes', None)
        if lignes_data is not None:
            remise = validated_data.get('remise', instance.remise)
            ht, ttc = _compute_totals(lignes_data, remise)
            validated_data['montant_ht'] = ht
            validated_data['montant_ttc'] = ttc
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        with transaction.atomic():
            instance.save()
            if lignes_data is not None:
                instance.lignes.all().delete()
                for i, l in enumerate(lignes_data):
                    ligne = {k: v for k, v in l.items() if k != 'ordre'}
                    LigneDevis.objects.create(devis=instance, ordre=i + 1, **ligne)
        return instance


class FactureSerializer(serializers.ModelSerializer):
    paiements  = PaiementSerializer(many=True, read_only=True)
    lignes     = LigneFactureSerializer(many=True, required=False)
    client_nom = serializers.SerializerMethodField()
    projet_nom = serializers.SerializerMethodField()

    class Meta:
        model = Facture
        fields = [
            'id', 'cabinet', 'client', 'projet', 'numero', 'statut',
            'montant_ht', 'montant_ttc', 'remise',
            'date_emission', 'date_echeance', 'phase',
            'conditions_paiement', 'rib', 'mentions_legales', 'notes',
            'paiements', 'lignes', 'client_nom', 'projet_nom',
        ]
        read_only_fields = ['cabinet', 'numero', 'montant_ht', 'montant_ttc']

    def get_client_nom(self, obj):
        return obj.client.nom if obj.client else ''

    def get_projet_nom(self, obj):
        return obj.projet.nom if obj.projet else ''

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes', [])
        remise = validated_data.get('remise', 0)
        ht, ttc = _compute_totals(lignes_data, remise)
        validated_data['montant_ht'] = ht
        validated_data['montant_ttc'] = ttc
        with transaction.atomic():
            facture = Facture.objects.create(**validated_data)
            for i, l in enumerate(lignes_data):
                ligne = {k: v for k, v in l.items() if k != 'ordre'}
                LigneFacture.objects.create(facture=facture, ordre=i + 1, **ligne)
        return facture

    def update(self, instance, validated_data):
        lignes_data = validated_data.pop('lignes', None)
        if lignes_data is not None:
            remise = validated_data.get('remise', instance.remise)
            ht, ttc = _compute_totals(lignes_data, remise)
            validated_data['montant_ht'] = ht
            validated_data['montant_ttc'] = ttc
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        with transaction.atomic():
            instance.save()
            if lignes_data is not None:
                instance.lignes.all().delete()
                for i, l in enumerate(lignes_data):
                    ligne = {k: v for k, v in l.items() if k != 'ordre'}
                    LigneFacture.objects.create(facture=instance, ordre=i + 1, **ligne)
        return instance


class ChargeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Charge
        fields = [
            'id', 'cabinet', 'projet', 'categorie', 'description',
            'montant', 'date', 'justificatif', 'paye_par'
        ]
        read_only_fields = ['cabinet', 'paye_par']
