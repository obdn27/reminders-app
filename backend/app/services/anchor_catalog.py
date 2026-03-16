ANCHOR_CONFIG = {
    'deep_work': {
        'title': 'Deep work',
        'short_title': 'Deep work',
        'target_unit': 'minutes',
        'tracking_type': 'session',
    },
    'job_applications': {
        'title': 'Job applications',
        'short_title': 'Applications',
        'target_unit': 'count',
        'tracking_type': 'count',
    },
    'upskilling': {
        'title': 'Upskilling',
        'short_title': 'Upskilling',
        'target_unit': 'minutes',
        'tracking_type': 'session',
    },
    'movement': {
        'title': 'Movement',
        'short_title': 'Movement',
        'target_unit': 'minutes',
        'tracking_type': 'session',
    },
    'chores_admin': {
        'title': 'Chores / Admin',
        'short_title': 'Chores',
        'target_unit': 'completion',
        'tracking_type': 'boolean',
    },
    'meals_cooking': {
        'title': 'Meals / Cooking',
        'short_title': 'Meals',
        'target_unit': 'completion',
        'tracking_type': 'boolean',
    },
    'planning': {
        'title': 'Planning',
        'short_title': 'Planning',
        'target_unit': 'completion',
        'tracking_type': 'boolean',
    },
}


def get_anchor_config(anchor_type: str) -> dict | None:
    return ANCHOR_CONFIG.get(anchor_type)
