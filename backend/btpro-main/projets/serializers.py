from rest_framework import serializers
from .models import Client, Projet, Phase, Tache, FeuilleDeTemps, SousTraitant, PermisConstruction, BudgetPoste, CompteRendu


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ['id', 'nom', 'contact_nom', 'telephone', 'email', 'adresse',
                  'numero_rc', 'nif', 'ai', 'nis']


class TacheSerializer(serializers.ModelSerializer):
    phase_nom = serializers.CharField(source='phase.nom', read_only=True)
    projet_nom = serializers.CharField(source='phase.projet.nom', read_only=True)
    phase = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Tache
        fields = ['id', 'phase', 'phase_nom', 'projet_nom', 'titre', 'description',
                  'priorite', 'statut', 'deadline', 'assignee', 'date_creation']
        extra_kwargs = {
            'statut':       {'required': False},
            'priorite':     {'required': False},
            'description':  {'required': False},
            'date_creation':{'read_only': True},
        }


class PhaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Phase
        fields = ['id', 'nom', 'pourcentage_honoraires', 'date_debut', 'date_fin', 'complete']


class ProjetSerializer(serializers.ModelSerializer):
    client = ClientSerializer(read_only=True)
    client_id = serializers.PrimaryKeyRelatedField(
        queryset=Client.objects.all(), source='client', write_only=True
    )
    phases = PhaseSerializer(many=True, read_only=True)
    devis_accepte = serializers.SerializerMethodField()

    class Meta:
        model = Projet
        fields = [
            'id', 'nom', 'type_projet', 'surface', 'adresse_chantier',
            'wilaya', 'statut', 'date_debut', 'date_fin_prevue',
            'honoraires_total', 'description', 'client', 'client_id', 'phases',
            'devis_accepte',
        ]

    def get_devis_accepte(self, obj):
        from finances.models import Devis
        d = Devis.objects.filter(projet=obj, statut='ACCEPTE').order_by('-date_emission').first()
        if d:
            return {'id': d.id, 'numero': d.numero, 'montant_ht': str(d.montant_ht), 'montant_ttc': str(d.montant_ttc)}
        return None


class FeuilleDeTempsSerializer(serializers.ModelSerializer):
    user_nom = serializers.SerializerMethodField()
    projet_nom = serializers.SerializerMethodField()
    montant = serializers.SerializerMethodField()
    taches_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tache.objects.all(), source='taches', write_only=True, required=False
    )
    taches_data = TacheSerializer(many=True, source='taches', read_only=True)

    class Meta:
        model = FeuilleDeTemps
        fields = [
            'id', 'user', 'projet', 'phase', 'date', 'heures',
            'taux_horaire', 'description', 'facturable', 'created_at',
            'user_nom', 'projet_nom', 'montant', 'taches_ids', 'taches_data',
        ]
        extra_kwargs = {
            'user': {'read_only': True},
        }

    def get_user_nom(self, obj):
        return obj.user.prenom + ' ' + obj.user.nom

    def get_projet_nom(self, obj):
        return obj.projet.nom

    def get_montant(self, obj):
        return str(obj.heures * obj.taux_horaire)


class SousTraitantSerializer(serializers.ModelSerializer):
    projet_nom = serializers.SerializerMethodField()

    class Meta:
        model  = SousTraitant
        fields = [
            'id', 'cabinet',
            'projet', 'projet_nom',
            'nom', 'type_prestation',
            'telephone', 'email',
            'montant', 'paye',
            'statut', 'date_debut', 'date_fin', 'notes', 'created_at',
        ]
        read_only_fields = ['cabinet']

    def get_projet_nom(self, obj):
        return obj.projet.nom if obj.projet_id else ''


class PermisConstructionSerializer(serializers.ModelSerializer):
    projet_nom = serializers.CharField(source='projet.nom', read_only=True)

    class Meta:
        model = PermisConstruction
        fields = [
            'id', 'projet', 'projet_nom', 'type_pc', 'statut', 'reference',
            'wilaya', 'date_depot', 'date_decision_prevue', 'date_obtention',
            'numero_arrete', 'observations', 'created_at',
        ]
        read_only_fields = ['cabinet']


class BudgetPosteSerializer(serializers.ModelSerializer):
    projet_nom = serializers.CharField(source='projet.nom', read_only=True)
    ecart = serializers.SerializerMethodField()

    class Meta:
        model = BudgetPoste
        fields = [
            'id', 'projet', 'projet_nom', 'categorie', 'libelle',
            'montant_prevu', 'montant_reel', 'ecart', 'created_at',
        ]
        read_only_fields = ['cabinet']

    def get_ecart(self, obj):
        return str(obj.montant_reel - obj.montant_prevu)


class CompteRenduSerializer(serializers.ModelSerializer):
    projet_nom = serializers.CharField(source='projet.nom', read_only=True)

    class Meta:
        model = CompteRendu
        fields = [
            'id', 'projet', 'projet_nom', 'titre', 'date', 'lieu',
            'animateur', 'participants', 'ordre_du_jour', 'decisions',
            'observations', 'created_at',
        ]
        read_only_fields = ['cabinet']
