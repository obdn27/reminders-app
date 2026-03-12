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
  const { ruleState, recommit, refreshTodayProgress } = useTodayProgress();
  const { refreshLatestReminder } = useReminders();
  const [working, setWorking] = useState(false);

  const message = ruleState?.reminderState
    ? `Current reminder state: ${ruleState.reminderState}. Miss streak: ${ruleState.missStreak}.`
    : 'No active missed-day event. Quick reset for tomorrow.';
  const shouldShowRecommit = Boolean(ruleState?.reminderState) || (ruleState?.missStreak || 0) > 0;

  const handleRecommit = async () => {
    setWorking(true);
    try {
      await recommit();
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

        <View style={styles.options}>
          {shouldShowRecommit ? (
            <PrimaryButton title={working ? 'Recommitting...' : 'Recommit'} onPress={handleRecommit} disabled={working} />
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
  options: { gap: 8 },
});
