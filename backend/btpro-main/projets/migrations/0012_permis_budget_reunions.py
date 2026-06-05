from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('cabinets', '0007_alter_abonnement_plan'),
        ('projets', '0011_soustraitant_devis_facture_statut'),
    ]

    operations = [
        migrations.CreateModel(
            name='PermisConstruction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type_pc', models.CharField(choices=[('PC', 'Permis de construire'), ('CU', "Certificat d'urbanisme"), ('DAEU', "Décl. achèvement"), ('AUTRE', 'Autre')], default='PC', max_length=10)),
                ('statut', models.CharField(choices=[('PREPARATION', 'En préparation'), ('DEPOSE', 'Déposé'), ('INSTRUCTION', 'En instruction'), ('OBTENU', 'Obtenu'), ('REFUSE', 'Refusé'), ('ARCHIVE', 'Archivé')], default='PREPARATION', max_length=20)),
                ('reference', models.CharField(blank=True, max_length=100)),
                ('wilaya', models.CharField(blank=True, max_length=50)),
                ('date_depot', models.DateField(blank=True, null=True)),
                ('date_decision_prevue', models.DateField(blank=True, null=True)),
                ('date_obtention', models.DateField(blank=True, null=True)),
                ('numero_arrete', models.CharField(blank=True, max_length=100)),
                ('observations', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('cabinet', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='permis', to='cabinets.cabinet')),
                ('projet', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='permis', to='projets.projet')),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='BudgetPoste',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('categorie', models.CharField(choices=[('HONORAIRES', 'Honoraires'), ('ETUDES', 'Études techniques'), ('TRAVAUX', 'Travaux'), ('ADMINISTRATION', 'Frais administratifs'), ('DIVERS', 'Divers')], default='DIVERS', max_length=20)),
                ('libelle', models.CharField(max_length=200)),
                ('montant_prevu', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('montant_reel', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('cabinet', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='budget_postes', to='cabinets.cabinet')),
                ('projet', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='budget_postes', to='projets.projet')),
            ],
            options={'ordering': ['categorie', 'libelle']},
        ),
        migrations.CreateModel(
            name='CompteRendu',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('titre', models.CharField(max_length=200)),
                ('date', models.DateField()),
                ('lieu', models.CharField(blank=True, max_length=200)),
                ('animateur', models.CharField(blank=True, max_length=100)),
                ('participants', models.TextField(blank=True)),
                ('ordre_du_jour', models.TextField(blank=True)),
                ('decisions', models.TextField(blank=True)),
                ('observations', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('cabinet', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comptes_rendus', to='cabinets.cabinet')),
                ('projet', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comptes_rendus', to='projets.projet')),
            ],
            options={'ordering': ['-date']},
        ),
    ]
