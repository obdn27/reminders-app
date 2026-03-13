ANCHOR_CONFIG = {
    'deep_work': {
        'title': 'Deep work',
        'target_unit': 'minutes',
        'tracking_type': 'session',
    },
    'job_applications': {
        'title': 'Job applications',
        'target_unit': 'count',
        'tracking_type': 'count',
    },
    'upskilling': {
        'title': 'Upskilling',
        'target_unit': 'minutes',
        'tracking_type': 'session',
    },
    'movement': {
        'title': 'Movement',
        'target_unit': 'minutes',
        'tracking_type': 'session',
    },
    'chores_admin': {
        'title': 'Chores / Admin',
        'target_unit': 'completion',
        'tracking_type': 'boolean',
    },
    'meals_cooking': {
        'title': 'Meals / Cooking',
        'target_unit': 'completion',
        'tracking_type': 'boolean',
    },
}


def get_anchor_config(anchor_type: str) -> dict | None:
    return ANCHOR_CONFIG.get(anchor_type)

