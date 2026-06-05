from django.db import migrations


def migrate_lignes(apps, schema_editor):
    Facture = apps.get_model('finances', 'Facture')
    LigneFacture = apps.get_model('finances', 'LigneFacture')
    Devis = apps.get_model('finances', 'Devis')
    LigneDevis = apps.get_model('finances', 'LigneDevis')

    for f in Facture.objects.all():
        if not LigneFacture.objects.filter(facture=f).exists():
            LigneFacture.objects.create(
                facture=f,
                designation="Honoraires d'architecture",
                quantite=1,
                prix_unitaire=f.montant_ht,
                tva=19,
                ordre=1,
            )

    for d in Devis.objects.all():
        if not LigneDevis.objects.filter(devis=d).exists():
            LigneDevis.objects.create(
                devis=d,
                designation=d.notes or "Honoraires d'architecture",
                quantite=1,
                prix_unitaire=d.montant_ht,
                tva=19,
                ordre=1,
            )


class Migration(migrations.Migration):

    dependencies = [
        ('finances', '0006_remove_devis_tva_remove_facture_tva_and_more'),
    ]

    operations = [
        migrations.RunPython(migrate_lignes, migrations.RunPython.noop),
    ]
