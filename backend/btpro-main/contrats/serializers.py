from rest_framework import serializers
from .models import Contrat, ArticleContrat


class ArticleContratSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArticleContrat
        fields = ['id', 'titre', 'contenu', 'ordre']


class ContratSerializer(serializers.ModelSerializer):
    client_nom     = serializers.SerializerMethodField()
    projet_nom     = serializers.SerializerMethodField()
    parent_numero  = serializers.SerializerMethodField()
    avenants_count = serializers.SerializerMethodField()
    articles       = ArticleContratSerializer(many=True, required=False)

    class Meta:
        model = Contrat
        fields = [
            'id', 'cabinet', 'projet', 'client', 'contrat_parent',
            'numero', 'type', 'statut', 'objet', 'missions',
            'montant_ht', 'tva', 'montant_ttc',
            'date_debut', 'date_fin', 'date_signature', 'date_creation',
            'notes',
            'client_nom', 'projet_nom', 'parent_numero', 'avenants_count',
            'articles',
        ]
        read_only_fields = ['cabinet', 'numero', 'date_creation']

    def get_client_nom(self, obj):
        return obj.client.nom

    def get_projet_nom(self, obj):
        return obj.projet.nom

    def get_parent_numero(self, obj):
        return obj.contrat_parent.numero if obj.contrat_parent else None

    def get_avenants_count(self, obj):
        return obj.avenants.count()

    def create(self, validated_data):
        articles_data = validated_data.pop('articles', None)
        contrat = Contrat.objects.create(**validated_data)
        if articles_data is not None:
            for i, a in enumerate(articles_data):
                a.pop('ordre', None)
                ArticleContrat.objects.create(contrat=contrat, ordre=i + 1, **a)
        else:
            # Articles par défaut selon le type
            from .models import ARTICLES_DEFAUT_CONTRAT, ARTICLES_DEFAUT_AVENANT
            templates = ARTICLES_DEFAUT_AVENANT if contrat.type == 'AVENANT' else ARTICLES_DEFAUT_CONTRAT
            for i, (titre, contenu) in enumerate(templates, start=1):
                ArticleContrat.objects.create(contrat=contrat, titre=titre, contenu=contenu, ordre=i)
        return contrat

    def update(self, instance, validated_data):
        articles_data = validated_data.pop('articles', None)
        if articles_data is not None:
            instance.articles.all().delete()
            for i, a in enumerate(articles_data):
                a.pop('ordre', None)
                ArticleContrat.objects.create(contrat=instance, ordre=i + 1, **a)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        return instance
