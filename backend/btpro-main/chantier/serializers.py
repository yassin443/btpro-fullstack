from rest_framework import serializers
from .models import JournalChantier, PhotoChantier, Reserve, OrdreService, RapportTerrain


class PhotoChantierSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhotoChantier
        fields = ['id', 'image', 'legende', 'date_prise']


class JournalChantierSerializer(serializers.ModelSerializer):
    photos = PhotoChantierSerializer(many=True, read_only=True)

    class Meta:
        model = JournalChantier
        fields = [
            'id', 'projet', 'date', 'meteo', 'effectif',
            'avancement', 'travaux_realises', 'observations',
            'redacteur', 'photos'
        ]
        extra_kwargs = {
            'projet': {'required': False},
            'redacteur': {'required': False},
        }


class ReserveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reserve
        fields = [
            'id', 'projet', 'description', 'responsable',
            'statut', 'date_constat', 'date_levee', 'photo'
        ]
        extra_kwargs = {
            'projet': {'required': False},
        }


class OrdreServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrdreService
        fields = ['id', 'projet', 'type_ordre', 'numero', 'description', 'date_emission', 'emis_par']
        extra_kwargs = {
            'projet': {'required': False},
            'emis_par': {'required': False},
        }


class RapportTerrainSerializer(serializers.ModelSerializer):
    redacteur_nom = serializers.SerializerMethodField()
    projet_nom = serializers.SerializerMethodField()

    class Meta:
        model = RapportTerrain
        fields = [
            'id', 'projet', 'redacteur', 'date', 'titre', 'lieu',
            'meteo', 'etat_general', 'observations',
            'securite_ok', 'structure_ok', 'electricite_ok',
            'plomberie_ok', 'etancheite_ok', 'finitions_ok',
            'actions_requises', 'points_controle', 'created_at',
            'redacteur_nom', 'projet_nom'
        ]
        extra_kwargs = {
            'redacteur': {'required': False},
        }

    def get_redacteur_nom(self, obj):
        return obj.redacteur.prenom + ' ' + obj.redacteur.nom

    def get_projet_nom(self, obj):
        return obj.projet.nom