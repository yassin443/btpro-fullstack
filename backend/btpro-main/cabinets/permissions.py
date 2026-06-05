LIMITS = {
    'SOLO':    {'users': 2,  'projets': 30},
    'CABINET': {'users': 5,  'projets': 75},
    'AGENCE':  {'users': 10, 'projets': 120},
}


def get_plan(user):
    if not user.cabinet or not hasattr(user.cabinet, 'abonnement'):
        return 'SOLO'
    plan = user.cabinet.abonnement.plan
    return 'AGENCE' if plan == 'PREMIUM' else plan


def peut_ajouter_projet(user):
    plan = get_plan(user)
    max_projets = LIMITS[plan]['projets']
    if max_projets is None:
        return True
    return user.cabinet.projets.count() < max_projets


def peut_ajouter_membre(user):
    from users.models import User
    plan = get_plan(user)
    cabinet = user.cabinet
    if not cabinet:
        return False
    nb_membres = User.objects.filter(cabinet=cabinet).count()
    return nb_membres < LIMITS[plan]['users']


def peut_rapport_auto(user):
    return get_plan(user) in ['CABINET', 'AGENCE']


def peut_portail_client(user):
    return get_plan(user) in ['CABINET', 'AGENCE']


def peut_sous_traitants(user):
    return get_plan(user) in ['CABINET', 'AGENCE']


def peut_planning(user):
    return get_plan(user) in ['CABINET', 'AGENCE']


def peut_export_comptable(user):
    return get_plan(user) == 'AGENCE'


def peut_api_access(user):
    return get_plan(user) == 'AGENCE'
