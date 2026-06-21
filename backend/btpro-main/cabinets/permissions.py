# Valeurs de repli si la table PlanConfig n'est pas (encore) renseignée.
LIMITS = {
    'SOLO':    {'users': 2,  'projets': 30,  'planning': False, 'soustraitants': False, 'export_compta': False, 'ia': True},
    'CABINET': {'users': 5,  'projets': 75,  'planning': True,  'soustraitants': True,  'export_compta': False, 'ia': True},
    'AGENCE':  {'users': 10, 'projets': 120, 'planning': True,  'soustraitants': True,  'export_compta': True,  'ia': True},
}


def get_plan(user):
    if not user.cabinet or not hasattr(user.cabinet, 'abonnement'):
        return 'SOLO'
    plan = user.cabinet.abonnement.plan
    return 'AGENCE' if plan == 'PREMIUM' else plan


def _cfg(plan):
    """Config du plan depuis la BDD (PlanConfig), avec repli sur LIMITS."""
    fallback = LIMITS.get(plan, LIMITS['SOLO'])
    try:
        from .models import PlanConfig
        p = PlanConfig.objects.filter(code=plan).first()
        if p:
            return {
                'users': p.max_users,
                'projets': p.max_projets,
                'planning': p.f_planning,
                'soustraitants': p.f_soustraitants,
                'export_compta': p.f_export_compta,
                'ia': p.f_ia,
            }
    except Exception:
        pass
    return fallback


def peut_ajouter_projet(user):
    max_projets = _cfg(get_plan(user))['projets']
    if max_projets is None or max_projets <= 0:   # <= 0 => illimité
        return True
    return user.cabinet.projets.count() < max_projets


def peut_ajouter_membre(user):
    from users.models import User
    cabinet = user.cabinet
    if not cabinet:
        return False
    nb_membres = User.objects.filter(cabinet=cabinet).count()
    return nb_membres < _cfg(get_plan(user))['users']


def peut_rapport_auto(user):
    return get_plan(user) in ['CABINET', 'AGENCE']


def peut_portail_client(user):
    return get_plan(user) in ['CABINET', 'AGENCE']


def peut_sous_traitants(user):
    return bool(_cfg(get_plan(user))['soustraitants'])


def peut_planning(user):
    return bool(_cfg(get_plan(user))['planning'])


def peut_export_comptable(user):
    return bool(_cfg(get_plan(user))['export_compta'])


def peut_api_access(user):
    return get_plan(user) == 'AGENCE'


def peut_utiliser_ia(user):
    return bool(_cfg(get_plan(user)).get('ia', True))
