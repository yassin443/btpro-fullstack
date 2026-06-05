from rest_framework import serializers
from .models import Document, Version


class VersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Version
        fields = ['id', 'numero_version', 'fichier', 'taille', 'commentaire', 'uploade_par', 'date_upload']
        extra_kwargs = {
            'numero_version': {'required': False},
            'uploade_par': {'required': False},
            'taille': {'required': False},
        }


class DocumentSerializer(serializers.ModelSerializer):
    versions = VersionSerializer(many=True, read_only=True)
    derniere_version = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ['id', 'projet', 'nom', 'type_document', 'description', 'uploade_par', 'date_upload', 'versions', 'derniere_version']
        extra_kwargs = {
            'projet': {'required': False},
            'uploade_par': {'required': False},
        }

    def get_derniere_version(self, obj):
        version = obj.versions.first()
        if version:
            return VersionSerializer(version).data
        return None