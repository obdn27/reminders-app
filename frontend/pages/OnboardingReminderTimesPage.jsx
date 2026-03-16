import { Text, View, StyleSheet } from 'react-native';
import Card from '../components/Card';
import OnboardingLayout from '../components/OnboardingLayout';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import TimePickerField from '../components/TimePickerField';
import { getAnchorDefinition, getAnchorLabel } from '../data/anchorCatalog';
import { formatReminderTime } from '../data/reminderTimes';
import { useOnboarding } from '../state/OnboardingContext';
import { theme } from '../theme/theme';

export default function OnboardingReminderTimesPage({ navigation }) {
  const { selectedAnchorDrafts, updateAnchorDraft } = useOnboarding();

  return (
    <ScreenContainer>
      <OnboardingLayout
        step={5}
        totalSteps={7}
        eyebrow="Reminder timing"
        title="Pick when each anchor should be checked back into view."
        subtitle="These are light nudge times, not alarms for every small action."
        footer={<PrimaryButton title="Choose tone" onPress={() => navigation.navigate('OnboardingTone')} />}
      >
        {selectedAnchorDrafts.map((anchor) => {
          const definition = getAnchorDefinition(anchor.anchorType);
          if (!definition) return null;

          return (
            <Card key={anchor.anchorType} style={styles.anchorCard}>
              <View style={styles.header}>
                <Text style={styles.title}>{getAnchorLabel(anchor)}</Text>
                <Text style={styles.meta}>{definition.title}</Text>
                <Text style={styles.description}>Reminder at {formatReminderTime(anchor.reminderTime)}</Text>
              </View>
              <TimePickerField
                label="Reminder time"
                value={anchor.reminderTime}
                onChange={(reminderTime) => updateAnchorDraft(anchor.anchorType, { reminderTime })}
                isLast
              />
            </Card>
          );
        })}
      </OnboardingLayout>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  anchorCard: {
    gap: theme.spacing.md,
  },
  header: {
    gap: theme.spacing.xs,
  },
  title: {
    ...theme.typography.titleSm,
    color: theme.colors.textPrimary,
  },
  meta: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  description: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
  },
});
