from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projets', '0009_alter_phase_pourcentage_honoraires'),
    ]

    operations = [
        migrations.AlterField(
            model_name='phase',
            name='nom',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('ESQUISSE', 'Esquisse'),
                    ('APS', 'Avant-projet sommaire'),
                    ('APD', 'Avant-projet détaillé'),
                    ('PRO', 'Projet'),
                    ('DCE', 'Dossier consultation entreprises'),
                    ('EXECUTION', 'Exécution'),
                    ('RECEPTION', 'Réception'),
                ],
            ),
        ),
    ]
