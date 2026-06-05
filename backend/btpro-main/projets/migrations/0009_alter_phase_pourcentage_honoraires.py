from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projets', '0008_tache_add_statuts_annule_suspendu'),
    ]

    operations = [
        migrations.AlterField(
            model_name='phase',
            name='pourcentage_honoraires',
            field=models.DecimalField(max_digits=5, decimal_places=2, default=0, blank=True),
        ),
    ]
