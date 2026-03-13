import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { useReminders } from '../state/ReminderContext';
import { useTodayProgress } from '../state/TodayProgressContext';
import { theme } from '../theme/theme';
import { goBackOrNavigateHome } from '../utils/navigation';

export default function DailyReviewPage({ navigation }) {
  const { ruleState, resetFromToday, refreshTodayProgress } = useTodayProgress();
  const { refreshLatestReminder } = useReminders();
  const [working, setWorking] = useState(false);

  const message = ruleState?.reminderState
    ? `Stability: ${ruleState.stabilityState}. Reminder: ${ruleState.reminderState}. Miss streak: ${ruleState.missStreak}.`
    : `Stability: ${ruleState?.stabilityState || 'stable'}. No active intervention right now.`;
  const shouldShowReset = ['checkin', 'reset_prompt'].includes(
    ruleState?.reminderState || ''
  );
  const actionTitle = ruleState?.reminderState === 'reset_prompt' ? 'Start again today' : 'Reset from today';

  const handleReset = async () => {
    setWorking(true);
    try {
      await resetFromToday();
      await refreshTodayProgress();
      await refreshLatestReminder();
      goBackOrNavigateHome(navigation);
    } finally {
      setWorking(false);
    }
  };

  return (
    <ScreenContainer>
      <Card style={styles.card}>
        <Text style={styles.title}>Daily review</Text>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.meta}>Today looks {ruleState?.dailyClassification || 'stable'}.</Text>

        <View style={styles.options}>
          {shouldShowReset ? (
            <PrimaryButton title={working ? 'Updating...' : actionTitle} onPress={handleReset} disabled={working} />
          ) : null}
          <SecondaryButton title="Adjust later" onPress={() => goBackOrNavigateHome(navigation)} />
          <SecondaryButton title="Dismiss" onPress={() => goBackOrNavigateHome(navigation)} />
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: theme.colors.textPrimary },
  message: { color: theme.colors.textSecondary, fontSize: 16, lineHeight: 24 },
  meta: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 20 },
  options: { gap: 8 },
});
