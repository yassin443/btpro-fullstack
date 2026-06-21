from django.db import migrations


PLANS = [
    {
        'code': 'SOLO', 'name': 'SOLO', 'prix': 4900, 'annuel': 49000, 'populaire': False, 'ordre': 1,
        'features': ['Projets illimités', 'Facturation & devis PDF', 'Suivi de chantier', 'Feuille de temps', 'Paiement Chargily Pay'],
        'max_users': 2, 'max_projets': 30, 'stockage_gb': 5,
        'f_planning': False, 'f_soustraitants': False, 'f_export_compta': False, 'f_ia': True,
    },
    {
        'code': 'CABINET', 'name': 'CABINET', 'prix': 8900, 'annuel': 89000, 'populaire': True, 'ordre': 2,
        'features': ['Tout de SOLO', "Planning d'équipe", 'Rentabilité par projet', 'Gestion de la paie', 'Rôles & permissions', 'Support prioritaire'],
        'max_users': 5, 'max_projets': 75, 'stockage_gb': 50,
        'f_planning': True, 'f_soustraitants': True, 'f_export_compta': False, 'f_ia': True,
    },
    {
        'code': 'AGENCE', 'name': 'AGENCE', 'prix': 14900, 'annuel': 149000, 'populaire': False, 'ordre': 3,
        'features': ['Tout de CABINET', 'Tableaux de bord avancés', 'Exports comptables', 'Multi-agences', 'Accompagnement dédié'],
        'max_users': 10, 'max_projets': 120, 'stockage_gb': 200,
        'f_planning': True, 'f_soustraitants': True, 'f_export_compta': True, 'f_ia': True,
    },
]


def seed(apps, schema_editor):
    PlanConfig = apps.get_model('cabinets', 'PlanConfig')
    SiteSetting = apps.get_model('cabinets', 'SiteSetting')
    for p in PLANS:
        PlanConfig.objects.update_or_create(code=p['code'], defaults=p)
    SiteSetting.objects.get_or_create(pk=1)


def unseed(apps, schema_editor):
    PlanConfig = apps.get_model('cabinets', 'PlanConfig')
    PlanConfig.objects.filter(code__in=['SOLO', 'CABINET', 'AGENCE']).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('cabinets', '0014_planconfig_sitesetting'),
    ]
    operations = [
        migrations.RunPython(seed, unseed),
    ]
