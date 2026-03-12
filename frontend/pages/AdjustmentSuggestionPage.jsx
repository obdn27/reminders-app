import { StyleSheet, Text } from 'react-native';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { useDailyGoals } from '../state/DailyGoalsContext';
import { theme } from '../theme/theme';

export default function AdjustmentSuggestionPage({ navigation }) {
  const { dailyGoals, saveDailyGoals } = useDailyGoals();

  const current = dailyGoals?.jobWorkMinutesGoal || 60;
  const proposed = Math.max(30, current - 15);

  const accept = async () => {
    await saveDailyGoals({
      jobWorkMinutesGoal: proposed,
      movementMinutesGoal: dailyGoals?.movementMinutesGoal || 20,
      dailyJobTaskGoal: dailyGoals?.dailyJobTaskGoal ?? true,
    });
    navigation.navigate('Home');
  };

  return (
    <ScreenContainer>
      <Card style={styles.card}>
        <Text style={styles.title}>Adjustment suggestion</Text>
        <Text style={styles.copy}>
          You are completing less than your current job work minimum regularly.
        </Text>
        <Text style={styles.copy}>
          Reduce daily job work goal from {current} to {proposed} minutes?
        </Text>
      </Card>

      <PrimaryButton title="Accept" onPress={accept} />
      <PrimaryButton variant="secondary" title="Reject" onPress={() => navigation.navigate('Home')} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  title: { fontSize: 22, fontWeight: '700', color: theme.colors.textPrimary },
  copy: { color: theme.colors.textSecondary, fontSize: 16, lineHeight: 24 },
});
