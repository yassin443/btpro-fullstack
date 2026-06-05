from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chantier', '0005_rapportterrain'),
    ]

    operations = [
        migrations.AddField(
            model_name='rapportterrain',
            name='points_controle',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
