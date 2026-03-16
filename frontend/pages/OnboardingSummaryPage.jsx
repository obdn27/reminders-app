import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Card from '../components/Card';
import OnboardingLayout from '../components/OnboardingLayout';
import OnboardingSummaryRow from '../components/OnboardingSummaryRow';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { GOAL_CONTEXT_OPTIONS, TONE_OPTIONS, getAnchorDefinition, getAnchorLabel } from '../data/anchorCatalog';
import { formatReminderTime } from '../data/reminderTimes';
import { formatDateParam } from '../services/timeMachine';
import { requestNotificationPermissions } from '../services/notifications';
import { useAnchors } from '../state/AnchorsContext';
import { useDailyGoals } from '../state/DailyGoalsContext';
import { useDebugTime } from '../state/DebugTimeContext';
import { useOnboarding } from '../state/OnboardingContext';
import { useProfile } from '../state/ProfileContext';
import { theme } from '../theme/theme';

function buildAnchorSummary(anchor) {
  const definition = getAnchorDefinition(anchor.anchorType);
  if (!definition) return '';
  if (anchor.targetUnit === 'minutes') {
    return `${getAnchorLabel(anchor)}: ${anchor.targetValue} min at ${formatReminderTime(anchor.reminderTime)}`;
  }
  if (anchor.targetUnit === 'count') {
    return `${getAnchorLabel(anchor)}: ${anchor.targetValue}/day at ${formatReminderTime(anchor.reminderTime)}`;
  }
  return `${getAnchorLabel(anchor)}: daily completion at ${formatReminderTime(anchor.reminderTime)}`;
}

export default function OnboardingSummaryPage({ navigation }) {
  const { nowDate } = useDebugTime();
  const { updateProfile } = useProfile();
  const { saveAnchors } = useAnchors();
  const { fetchDailyGoals } = useDailyGoals();
  const { state, selectedAnchorDrafts, resetOnboarding } = useOnboarding();
  const [saving, setSaving] = useState(false);

  const goalContextTitle =
    GOAL_CONTEXT_OPTIONS.find((item) => item.value === state.goalContext)?.title || 'Current sprint';
  const toneTitle = TONE_OPTIONS.find((item) => item.value === state.tonePreference)?.title || 'Neutral';

  const startSprint = async () => {
    setSaving(true);
    try {
      const start = new Date(nowDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 60);

      await requestNotificationPermissions();
      await saveAnchors({ anchors: selectedAnchorDrafts });
      await updateProfile({
        goalContext: state.goalContext,
        tonePreference: state.tonePreference,
        sprintModeEnabled: true,
        sprintStartDate: formatDateParam(start),
        sprintEndDate: formatDateParam(end),
        hasCompletedOnboarding: true,
      });
      await fetchDailyGoals();
      resetOnboarding();
      navigation.reset({ index: 1, routes: [{ name: 'Home' }, { name: 'OnboardingFirstAction' }] });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer>
      <OnboardingLayout
        step={7}
        totalSteps={7}
        eyebrow="Sprint summary"
        title="This is the structure you are starting with."
        subtitle="Keep it narrow, realistic, and hard to drift away from."
        footer={
          <PrimaryButton title={saving ? 'Starting sprint...' : 'Start sprint'} onPress={startSprint} disabled={saving} />
        }
      >
        <Card>
          <OnboardingSummaryRow label="Current context" value={goalContextTitle} />
          <OnboardingSummaryRow label="Sprint length" value="60 days" />
          <OnboardingSummaryRow label="Tone" value={toneTitle} isLast />
        </Card>

        <Card style={styles.anchorSummaryCard}>
          <Text style={styles.anchorSummaryTitle}>Daily anchors</Text>
          {selectedAnchorDrafts.map((anchor, index) => (
            <OnboardingSummaryRow
              key={anchor.anchorType}
              label={getAnchorLabel(anchor)}
              value={buildAnchorSummary(anchor).replace(`${getAnchorLabel(anchor)}: `, '')}
              isLast={index === selectedAnchorDrafts.length - 1}
            />
          ))}
        </Card>
      </OnboardingLayout>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  anchorSummaryCard: {
    gap: 0,
  },
  anchorSummaryTitle: {
    ...theme.typography.titleSm,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
});
