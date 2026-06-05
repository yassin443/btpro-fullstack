from django.db import migrations

MISSIONS_LABELS = {
    'ESQ': 'Esquisse (ESQ)', 'APS': 'Avant-Projet Sommaire (APS)',
    'APD': 'Avant-Projet Détaillé (APD)', 'PC': 'Permis de Construire (PC)',
    'DCE': 'Dossier Consultation Entreprises (DCE)', 'APM': 'Assistance Passation Marchés (APM)',
    'DET': 'Direction Exécution des Travaux (DET)', 'AOR': "Assistance Opérations de Réception (AOR)",
}

ARTICLES_CONTRAT = [
    ('Objet du contrat', ''),
    ('Étendue de la mission', ''),
    ('Honoraires', ''),
    ('Modalités de paiement', "30% à la signature du contrat.\n20% à la validation de l'APS.\n25% à la remise de l'APD et du permis de construire.\n15% à la remise du DCE.\n10% à la réception définitive des travaux."),
    ('Durée & délais', ''),
    ('Obligations des parties', "Le Maître d'ouvrage s'engage à fournir les documents nécessaires et à régler les honoraires conformément à l'article sur les modalités de paiement. Le Maître d'œuvre s'engage à exécuter sa mission avec diligence, dans le respect des règles de l'art et des dispositions légales en vigueur en Algérie."),
    ('Assurance & responsabilité', "Le Maître d'œuvre déclare avoir souscrit une assurance professionnelle (Garantie Décennale et Responsabilité Civile) couvrant les risques liés à l'exercice de sa mission."),
    ('Résiliation', "En cas de manquement grave, le contrat pourra être résilié de plein droit, après mise en demeure restée sans effet pendant 30 jours. Les honoraires des phases déjà réalisées restent acquis au Maître d'œuvre."),
    ('Litiges & juridiction compétente', "Tout différend sera, à défaut de règlement amiable, porté devant le Tribunal d'Alger, seul compétent. Le contrat est soumis au droit algérien."),
]

ARTICLES_AVENANT = [
    ('Préambule', ''),
    ("Objet de l'avenant", ''),
    ('Honoraires complémentaires', ''),
    ('Dispositions inchangées', "Toutes les autres clauses du contrat initial non expressément modifiées par le présent avenant demeurent en vigueur."),
]


def migrate_articles(apps, schema_editor):
    Contrat = apps.get_model('contrats', 'Contrat')
    ArticleContrat = apps.get_model('contrats', 'ArticleContrat')

    for c in Contrat.objects.all():
        if ArticleContrat.objects.filter(contrat=c).exists():
            continue

        templates = ARTICLES_AVENANT if c.type == 'AVENANT' else ARTICLES_CONTRAT

        for i, (titre, contenu_defaut) in enumerate(templates, start=1):
            contenu = contenu_defaut

            if c.type != 'AVENANT':
                if titre == 'Objet du contrat' and c.objet:
                    contenu = c.objet
                elif titre == 'Étendue de la mission' and c.missions:
                    labels = ', '.join(MISSIONS_LABELS.get(m, m) for m in c.missions)
                    contenu = f'La mission comprend les phases suivantes : {labels}.'
                elif titre == 'Honoraires':
                    contenu = f'Montant HT : {c.montant_ht} DA — Total TTC : {c.montant_ttc} DA (TVA {c.tva}%).'
                elif titre == 'Durée & délais' and c.date_debut and c.date_fin:
                    contenu = f'Le contrat prend effet le {c.date_debut} et se termine le {c.date_fin}.'
            else:
                if titre == 'Préambule' and c.contrat_parent:
                    contenu = f"Les parties ont conclu un contrat de maîtrise d'œuvre référencé {c.contrat_parent.numero}, portant sur le projet « {c.projet.nom} »."
                elif titre == 'Honoraires complémentaires':
                    contenu = f'Montant additionnel TTC : {c.montant_ttc} DA.'

            ArticleContrat.objects.create(contrat=c, titre=titre, contenu=contenu, ordre=i)


class Migration(migrations.Migration):

    dependencies = [
        ('contrats', '0002_articlecontrat'),
    ]

    operations = [
        migrations.RunPython(migrate_articles, migrations.RunPython.noop),
    ]
