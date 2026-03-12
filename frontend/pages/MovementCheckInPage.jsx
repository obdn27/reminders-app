import { StyleSheet, Text, View } from 'react-native';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { useDailyGoals } from '../state/DailyGoalsContext';
import { useTodayProgress } from '../state/TodayProgressContext';
import { theme } from '../theme/theme';
import { goBackOrNavigateHome } from '../utils/navigation';

export default function MovementCheckInPage({ navigation }) {
  const { todayProgress, updateTodayProgress } = useTodayProgress();
  const { dailyGoals } = useDailyGoals();

  const movementGoal = dailyGoals?.movementMinutesGoal || 20;
  const alreadyDone = (todayProgress?.movementMinutesCompleted || 0) >= movementGoal;

  const complete = async () => {
    await updateTodayProgress({ movementMinutesCompleted: movementGoal });
    goBackOrNavigateHome(navigation);
  };

  return (
    <ScreenContainer>
      <Card style={styles.card}>
        <Text style={styles.title}>Movement check-in</Text>
        <Text style={styles.copy}>Did you complete your movement minimum today?</Text>

        <View style={styles.actions}>
          <PrimaryButton title="Yes, completed" onPress={complete} />
          <PrimaryButton variant="secondary" title="Not yet" onPress={() => navigation.goBack()} />
        </View>

        {alreadyDone ? <Text style={styles.done}>Already marked complete for today.</Text> : null}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: theme.colors.textPrimary },
  copy: { color: theme.colors.textSecondary, fontSize: 16, lineHeight: 22 },
  actions: { gap: 8 },
  done: { color: theme.colors.success, fontWeight: '700' },
});
