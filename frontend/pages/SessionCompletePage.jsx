import { StyleSheet, Text } from 'react-native';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import ProgressRow from '../components/ProgressRow';
import { useDailyGoals } from '../state/DailyGoalsContext';
import { useSessionState } from '../state/SessionContext';
import { useTodayProgress } from '../state/TodayProgressContext';
import { theme } from '../theme/theme';
import { goBackOrNavigateHome } from '../utils/navigation';

export default function SessionCompletePage({ navigation }) {
  const { lastSessionResult } = useSessionState();
  const { todayProgress } = useTodayProgress();
  const { dailyGoals } = useDailyGoals();

  const isMovement = lastSessionResult?.type === 'movement';

  return (
    <ScreenContainer>
      <Card style={styles.card}>
        <Text style={styles.title}>Session complete</Text>
        <Text style={styles.copy}>
          Completed {lastSessionResult?.completedMinutes || 0} minutes in{' '}
          {lastSessionResult?.title || lastSessionResult?.category || 'session'} ({isMovement ? 'movement' : 'focus'}).
        </Text>

        {isMovement ? (
          <ProgressRow
            label="Today's movement progress"
            done={todayProgress?.movementMinutesCompleted || 0}
            total={dailyGoals?.movementMinutesGoal || 20}
            suffix=" min"
          />
        ) : (
          <ProgressRow
            label="Today's job-work progress"
            done={todayProgress?.jobWorkMinutesCompleted || 0}
            total={dailyGoals?.jobWorkMinutesGoal || 60}
            suffix=" min"
          />
        )}

        <Text style={styles.reinforcement}>Strong close. Keep the baseline alive.</Text>
        {lastSessionResult?.nextAnchorLabel ? (
          <Text style={styles.nextUp}>Next up: {lastSessionResult.nextAnchorLabel}</Text>
        ) : null}
      </Card>

      <PrimaryButton title="Return home" onPress={() => goBackOrNavigateHome(navigation)} />
      <PrimaryButton
        variant="secondary"
        title={isMovement ? 'Start another movement session' : 'Start another focus session'}
        onPress={() => navigation.replace(isMovement ? 'StartMovementSession' : 'StartFocusSession')}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  title: { fontSize: 24, fontWeight: '800', color: theme.colors.textPrimary },
  copy: { color: theme.colors.textSecondary, fontSize: 15, lineHeight: 22 },
  reinforcement: { marginTop: 4, color: theme.colors.textPrimary, fontWeight: '700' },
  nextUp: { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 20 },
});
