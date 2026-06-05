from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projets', '0012_permis_budget_reunions'),
    ]

    operations = [
        # supprimer les anciens champs complexes
        migrations.RemoveField(model_name='soustraitant', name='montant_devis'),
        migrations.RemoveField(model_name='soustraitant', name='montant_facture'),
        migrations.RemoveField(model_name='soustraitant', name='montant_paye'),
        # ajouter les nouveaux champs simples
        migrations.AddField(
            model_name='soustraitant',
            name='montant',
            field=models.DecimalField(max_digits=15, decimal_places=2, default=0),
        ),
        migrations.AddField(
            model_name='soustraitant',
            name='paye',
            field=models.BooleanField(default=False),
        ),
        # simplifier les statuts
        migrations.AlterField(
            model_name='soustraitant',
            name='statut',
            field=models.CharField(
                max_length=20,
                choices=[('ACTIF', 'Actif'), ('TERMINE', 'Terminé'), ('SUSPENDU', 'Suspendu')],
                default='ACTIF',
            ),
        ),
    ]
