import { StyleSheet, Text } from 'react-native';

import Card from '../components/Card';
import ScreenContainer from '../components/ScreenContainer';
import SectionHeader from '../components/SectionHeader';
import { theme } from '../theme/theme';

function Step({ title, body }) {
  return (
    <Card style={styles.stepCard}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepBody}>{body}</Text>
    </Card>
  );
}

export default function HowItWorksPage() {
  return (
    <ScreenContainer>
      <SectionHeader
        title="How This App Works"
        subtitle="Simple baseline discipline loop"
      />

      <Step
        title="1. Set daily minimum goals"
        body="Choose realistic daily goals for job work, movement, and one job task."
      />
      <Step
        title="2. Log work and movement sessions"
        body="Run focus or movement sessions from the home screen. Completed minutes are saved automatically."
      />
      <Step
        title="3. Track daily progress"
        body="The app compares completed minutes and tasks against your daily minimum settings."
      />
      <Step
        title="4. Receive reminder states"
        body="If consistency drops, the app distinguishes fragile days from real drift and prompts you to steady or start again."
      />
      <Step
        title="5. Review weekly consistency"
        body="Weekly reviews summarize days met, streaks, missed areas, and drift signals for reflection."
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  stepCard: {
    gap: theme.spacing.sm,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  stepBody: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textSecondary,
  },
});
