from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('projets', '0015_remove_feuilledetemps_taches_delete_tache'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Tache',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('titre', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('priorite', models.CharField(choices=[('BASSE', 'Basse'), ('NORMALE', 'Normale'), ('HAUTE', 'Haute'), ('URGENTE', 'Urgente')], default='NORMALE', max_length=10)),
                ('statut', models.CharField(choices=[('A_FAIRE', 'À faire'), ('EN_COURS', 'En cours'), ('TERMINE', 'Terminé'), ('ANNULE', 'Annulé'), ('SUSPENDU', 'Suspendu')], default='A_FAIRE', max_length=10)),
                ('deadline', models.DateField(blank=True, null=True)),
                ('date_creation', models.DateTimeField(auto_now_add=True)),
                ('assignee', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ('phase', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='taches', to='projets.phase')),
            ],
        ),
        migrations.AddField(
            model_name='feuilledetemps',
            name='taches',
            field=models.ManyToManyField(blank=True, related_name='feuilles', to='projets.tache'),
        ),
    ]
