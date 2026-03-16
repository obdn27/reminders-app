export const GOAL_CONTEXT_OPTIONS = [
  {
    value: 'getting_a_job',
    title: 'Getting a job',
    description: 'Keep steady structure while searching, applying, and preparing.',
    icon: 'briefcase-search',
  },
  {
    value: 'building_projects',
    title: 'Building projects',
    description: 'Protect focused build time and keep momentum moving.',
    icon: 'laptop',
  },
  {
    value: 'passing_exams',
    title: 'Passing exams',
    description: 'Make studying and recovery consistent enough to hold.',
    icon: 'school-outline',
  },
  {
    value: 'general_productivity',
    title: 'General productivity',
    description: 'Use a few daily anchors to stay steady through a messy stretch.',
    icon: 'compass-outline',
  },
];

export const ANCHOR_CATALOG = [
  {
    type: 'deep_work',
    title: 'Deep work',
    shortTitle: 'Deep work',
    description: 'Protected concentration time.',
    icon: 'timer-outline',
    trackingType: 'session',
    targetUnit: 'minutes',
    defaultTarget: 60,
    targetOptions: Array.from({ length: 19 }, (_, index) => (index + 2) * 15),
    defaultReminderTime: '09:30',
  },
  {
    type: 'job_applications',
    title: 'Job applications',
    shortTitle: 'Applications',
    description: 'A fixed number of applications or outreach actions.',
    icon: 'send-outline',
    trackingType: 'count',
    targetUnit: 'count',
    defaultTarget: 2,
    targetOptions: [1, 2, 3, 4, 5],
    defaultReminderTime: '15:00',
  },
  {
    type: 'upskilling',
    title: 'Upskilling',
    shortTitle: 'Upskilling',
    description: 'Practice, learn, or review something useful every day.',
    icon: 'book-outline',
    trackingType: 'session',
    targetUnit: 'minutes',
    defaultTarget: 30,
    targetOptions: Array.from({ length: 12 }, (_, index) => (index + 1) * 15),
    defaultReminderTime: '11:00',
  },
  {
    type: 'movement',
    title: 'Movement',
    shortTitle: 'Movement',
    description: 'Keep your body in the loop so the rest does not collapse.',
    icon: 'run-fast',
    trackingType: 'session',
    targetUnit: 'minutes',
    defaultTarget: 20,
    targetOptions: Array.from({ length: 12 }, (_, index) => (index + 1) * 10),
    defaultReminderTime: '18:30',
  },
  {
    type: 'chores_admin',
    title: 'Chores / Admin',
    shortTitle: 'Chores',
    description: 'Keep the small practical tasks from quietly piling up.',
    icon: 'clipboard-check-outline',
    trackingType: 'boolean',
    targetUnit: 'completion',
    defaultTarget: 1,
    targetOptions: [1],
    defaultReminderTime: '19:00',
  },
  {
    type: 'meals_cooking',
    title: 'Meals / Cooking',
    shortTitle: 'Meals',
    description: 'A basic meal or cooking anchor that supports the rest of the sprint.',
    icon: 'silverware-fork-knife',
    trackingType: 'boolean',
    targetUnit: 'completion',
    defaultTarget: 1,
    targetOptions: [1],
    defaultReminderTime: '18:00',
  },
  {
    type: 'planning',
    title: 'Planning',
    shortTitle: 'Planning',
    description: 'A brief reset to decide what matters before the day drifts.',
    icon: 'notebook-outline',
    trackingType: 'boolean',
    targetUnit: 'completion',
    defaultTarget: 1,
    targetOptions: [1],
    defaultReminderTime: '08:30',
  },
];

export const TONE_OPTIONS = [
  {
    value: 'direct',
    title: 'Direct',
    example: 'You are off track. Start one focused block now.',
  },
  {
    value: 'neutral',
    title: 'Neutral',
    example: 'Today slipped. Pick one anchor and resume from there.',
  },
  {
    value: 'supportive',
    title: 'Supportive',
    example: 'A rough day does not erase the sprint. Start with one small block.',
  },
];

export function getAnchorDefinition(anchorType) {
  return ANCHOR_CATALOG.find((item) => item.type === anchorType) || null;
}

export function buildAnchorDraft(anchorType) {
  const definition = getAnchorDefinition(anchorType);
  if (!definition) {
    return null;
  }

  return {
    id: null,
    category: definition.type,
    anchorType: definition.type,
    label: definition.title,
    trackingType: definition.trackingType,
    targetValue: definition.defaultTarget,
    targetUnit: definition.targetUnit,
    reminderTime: definition.defaultReminderTime,
    nextAnchorId: null,
    active: true,
  };
}

export function getAnchorLabel(anchor) {
  return anchor?.label || getAnchorDefinition(anchor?.category || anchor?.anchorType)?.title || 'Anchor';
}
