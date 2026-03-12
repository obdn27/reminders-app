import { useCallback, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import ProgressRow from '../components/ProgressRow';
import ScreenContainer from '../components/ScreenContainer';
import SectionHeader from '../components/SectionHeader';
import StatTile from '../components/StatTile';
import { useProfile } from '../state/ProfileContext';
import { useDailyGoals } from '../state/DailyGoalsContext';
import { useDebugTime } from '../state/DebugTimeContext';
import { useReminders } from '../state/ReminderContext';
import { useTodayProgress } from '../state/TodayProgressContext';
import { theme } from '../theme/theme';

export default function HomePage({ navigation }) {
  const { nowDate } = useDebugTime();
  const { profile } = useProfile();
  const { dailyGoals, fetchDailyGoals } = useDailyGoals();
  const { latestReminder, refreshLatestReminder, openReminder } = useReminders();
  const { todayProgress, ruleState, refreshTodayProgress, markDailyJobTaskComplete } =
    useTodayProgress();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      await fetchDailyGoals();
      if (cancelled) return;
      await refreshTodayProgress();
      if (cancelled) return;
      await refreshLatestReminder();
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const run = async () => {
        await refreshTodayProgress();
        await refreshLatestReminder();
      };
      run();
    }, [])
  );

  const dateLabel = nowDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const asOfDate = nowDate.toISOString().slice(0, 10);
  const currentReminder = latestReminder?.date === asOfDate ? latestReminder : null;

  const jobGoal = dailyGoals?.jobWorkMinutesGoal || 60;
  const movementGoal = dailyGoals?.movementMinutesGoal || 20;
  const requiresTask = dailyGoals?.dailyJobTaskGoal ?? true;

  const jobDone = todayProgress?.jobWorkMinutesCompleted || 0;
  const movementDone = todayProgress?.movementMinutesCompleted || 0;
  const taskDone = todayProgress?.dailyJobTaskCompleted || false;

  const remainingJob = Math.max(0, jobGoal - jobDone);
  const remainingMovement = Math.max(0, movementGoal - movementDone);

  return (
    <ScreenContainer>
      <Card>
        <Text style={styles.date}>{dateLabel}</Text>
        <Text style={styles.title}>Hello{profile?.name ? `, ${profile.name}` : ''}</Text>
        <Text style={styles.subtitle}>
          Sprint dashboard.
        </Text>
      </Card>

      <View style={styles.statGrid}>
        <StatTile label="Job remaining" value={`${remainingJob}m`} helper={`${jobDone}/${jobGoal} done`} />
        <StatTile
          label="Movement remaining"
          value={`${remainingMovement}m`}
          helper={`${movementDone}/${movementGoal} done`}
        />
      </View>

      <Card>
        <SectionHeader
          title="Today's Goals"
          subtitle={
            requiresTask
              ? `Task ${taskDone ? 'completed' : 'still pending'}`
              : 'No daily task required'
          }
        />
        <Text style={styles.remainingText}>
          {profile?.name ? `Hi ${profile.name}. ` : ''}
          Remaining: {remainingJob}m job work, {remainingMovement}m movement.
        </Text>
        <View style={styles.progressList}>
          <ProgressRow label="Job work" done={jobDone} total={jobGoal} suffix=" min" />
          <ProgressRow label="Movement" done={movementDone} total={movementGoal} suffix=" min" />
          {requiresTask ? <ProgressRow label="Daily job task" done={taskDone ? 1 : 0} total={1} /> : null}
        </View>
        {requiresTask && !taskDone ? (
          <View style={styles.taskActionWrap}>
            <PrimaryButton title="Mark daily job task complete" onPress={markDailyJobTaskComplete} />
          </View>
        ) : null}
      </Card>

      <Card>
        <SectionHeader title="Quick Actions" />
        <View style={styles.actions}>
          <PrimaryButton title="Start focus session" onPress={() => navigation.navigate('StartFocusSession')} />
          <PrimaryButton title="Start movement session" onPress={() => navigation.navigate('StartMovementSession')} />
          <PrimaryButton variant="secondary" title="Movement check-in" onPress={() => navigation.navigate('MovementCheckIn')} />
          <PrimaryButton variant="secondary" title="Daily review" onPress={() => navigation.navigate('DailyReview')} />
          <PrimaryButton variant="secondary" title="Weekly review" onPress={() => navigation.navigate('WeeklyReview')} />
          <PrimaryButton variant="secondary" title="History" onPress={() => navigation.navigate('History')} />
          <PrimaryButton variant="secondary" title="Settings" onPress={() => navigation.navigate('Settings')} />
        </View>
      </Card>

      {currentReminder ? (
        <Card style={styles.reminderCard}>
          <SectionHeader title={`Reminder: ${currentReminder.type}`} subtitle={currentReminder.title} />
          <Text style={styles.reminderText}>{currentReminder.body}</Text>
          {!currentReminder.opened ? (
            <PrimaryButton
              variant="secondary"
              title="Mark as opened"
              onPress={() => openReminder(currentReminder.id)}
            />
          ) : null}
        </Card>
      ) : ruleState?.reminderState ? (
        <Card style={styles.reminderCard}>
          <Text style={styles.reminderTitle}>Reminder state: {ruleState.reminderState}</Text>
          <Text style={styles.reminderText}>
            Miss streak: {ruleState.missStreak} | Drift: {(ruleState.driftFlags || []).join(', ') || 'none'}
          </Text>
        </Card>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  date: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    color: theme.colors.textPrimary,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 6,
    color: theme.colors.textMuted,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  remainingText: { marginTop: theme.spacing.sm, color: theme.colors.textSecondary, marginBottom: 10 },
  progressList: {
    gap: theme.spacing.md,
  },
  actions: {
    gap: theme.spacing.sm,
  },
  taskActionWrap: {
    marginTop: theme.spacing.md,
  },
  reminderCard: {
    backgroundColor: theme.colors.reminderBg,
    borderColor: theme.colors.reminderBorder,
    gap: 10,
  },
  reminderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.reminderText,
  },
  reminderText: {
    color: theme.colors.reminderText,
    fontSize: 15,
    lineHeight: 21,
  },
});
