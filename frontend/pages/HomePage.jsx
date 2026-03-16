import { useCallback, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '../components/Card';
import IconAction from '../components/IconAction';
import PrimaryButton from '../components/PrimaryButton';
import ProgressRow from '../components/ProgressRow';
import SectionHeader from '../components/SectionHeader';
import { formatDateParam } from '../services/timeMachine';
import { GOAL_CONTEXT_OPTIONS } from '../data/anchorCatalog';
import { useAnchors } from '../state/AnchorsContext';
import { useAnchorProgress } from '../state/AnchorProgressContext';
import { useDebugTime } from '../state/DebugTimeContext';
import { useProfile } from '../state/ProfileContext';
import { useReminders } from '../state/ReminderContext';
import { useSessionState } from '../state/SessionContext';
import { useTodayProgress } from '../state/TodayProgressContext';
import { syncAnchorReminderNotifications } from '../services/notifications';
import { theme } from '../theme/theme';
import { getNextUpSuggestion } from '../utils/anchors';

function getReminderState(source) {
  return source?.reminderState || source?.type || null;
}

function formatReminderTitle(source) {
  const reminderState = getReminderState(source);
  if (!reminderState) return null;
  if (reminderState === 'reset_prompt') return 'Start again today';
  return "You've been drifting recently.";
}

function getSprintDayCount(asOfDate, sprintStartDate) {
  if (!sprintStartDate) return null;
  const targetTime = new Date(`${asOfDate}T12:00:00`).getTime();
  const startTime = new Date(`${sprintStartDate}T12:00:00`).getTime();
  return Math.max(1, Math.floor((targetTime - startTime) / (1000 * 60 * 60 * 24)) + 1);
}

function getAnchorSummary(anchors) {
  const incomplete = anchors.filter((anchor) => !anchor.completed);
  if (!incomplete.length) return 'All anchors are complete.';
  if (incomplete.length === 1) return `${incomplete[0].label} is left.`;
  return `${incomplete.length} anchors still need attention today.`;
}

function ActionGridCard({ anchors, navigation, onManualAction }) {
  const actionableAnchors = anchors.filter((anchor) => !anchor.completed || anchor.trackingType === 'session');

  if (!actionableAnchors.length) {
    return null;
  }

  return (
    <View style={styles.actionsGrid}>
      {actionableAnchors.map((anchor) => {
        const isMovement = anchor.anchorType === 'movement';
        const isSession = anchor.trackingType === 'session';
        const routeName = isMovement ? 'StartMovementSession' : 'StartFocusSession';
        let buttonTitle = '';

        if (isSession) {
          buttonTitle = anchor.label;
        } else {
          buttonTitle = anchor.trackingType === 'count' ? `${anchor.label} +1` : anchor.label;
        }

        return (
          <Pressable
            key={anchor.anchorId}
            onPress={() => {
              if (!isSession) {
                onManualAction(anchor);
                return;
              }

              navigation.navigate(routeName, {
                anchorType: anchor.anchorType,
                anchorTitle: anchor.label,
                defaultDuration: anchor.targetUnit === 'minutes' ? anchor.targetValue : 30,
                nextAnchorId: anchor.nextAnchorId,
                nextAnchorLabel: anchor.nextAnchorLabel,
              });
            }}
            style={({ pressed }) => [
              styles.actionTile,
              isSession ? styles.actionTilePrimary : styles.actionTileSecondary,
              pressed ? styles.actionTilePressed : null,
            ]}
          >
            <MaterialCommunityIcons
              name={
                isSession
                  ? isMovement
                    ? 'run-fast'
                    : 'timer-outline'
                  : anchor.trackingType === 'count'
                    ? 'plus'
                    : 'check'
              }
              size={18}
              color={isSession ? theme.colors.primaryDark : theme.colors.textPrimary}
            />
            <Text style={[styles.actionText, isSession ? styles.actionTextPrimary : styles.actionTextSecondary]}>
              {buttonTitle}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function HomePage({ navigation }) {
  const insets = useSafeAreaInsets();
  const { nowDate } = useDebugTime();
  const asOfDate = formatDateParam(nowDate);
  const { profile } = useProfile();
  const { anchors, fetchAnchors } = useAnchors();
  const { todayAnchors, refreshTodayAnchors, saveAnchorProgress } = useAnchorProgress();
  const { latestReminder, refreshLatestReminder, openReminder } = useReminders();
  const { activeSession } = useSessionState();
  const { todayProgress, ruleState, refreshTodayProgress } = useTodayProgress();

  const loadHome = useCallback(async () => {
    await fetchAnchors();
    await refreshTodayAnchors();
    await refreshTodayProgress();
    await refreshLatestReminder();
  }, [asOfDate]);

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  useFocusEffect(
    useCallback(() => {
      loadHome();
    }, [loadHome])
  );

  const dateLabel = nowDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const currentReminder = latestReminder?.date === asOfDate ? latestReminder : null;
  const hasDismissedTodayReminder = Boolean(currentReminder?.opened);

  useEffect(() => {
    if (currentReminder?.id && !currentReminder.opened) {
      openReminder(currentReminder.id).catch(() => {});
    }
  }, [currentReminder?.id, currentReminder?.opened]);

  const anchorItems = todayAnchors?.anchors || [];
  const completedGoalsCount = todayAnchors?.completedAnchors || 0;
  const totalGoalsCount = todayAnchors?.totalAnchors || anchorItems.length;
  const sprintDayCount = getSprintDayCount(asOfDate, profile?.sprintStartDate);
  const activeReminder = hasDismissedTodayReminder ? null : currentReminder || ruleState;
  const goalContextTitle =
    GOAL_CONTEXT_OPTIONS.find((item) => item.value === profile?.goalContext)?.title || 'Current sprint';
  const nextSuggestion = getNextUpSuggestion(anchorItems);

  useEffect(() => {
    syncAnchorReminderNotifications({
      anchors,
      todayAnchors: anchorItems,
      activeSession,
      retentionState: ruleState?.retentionState,
    }).catch(() => {});
  }, [anchors, anchorItems, activeSession, ruleState?.retentionState]);

  const handleManualAnchor = async (anchor) => {
    if (anchor.trackingType === 'count') {
      await saveAnchorProgress({ anchorId: anchor.anchorId, incrementBy: 1 });
      await refreshTodayProgress();
      return;
    }

    if (anchor.trackingType === 'boolean') {
      await saveAnchorProgress({ anchorId: anchor.anchorId, completed: !anchor.completed });
      await refreshTodayProgress();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>{sprintDayCount ? `Day ${sprintDayCount}` : dateLabel}</Text>
              <Text style={styles.date}>{dateLabel}</Text>
              <Text style={styles.context}>{goalContextTitle}</Text>
            </View>
            <View style={styles.goalCountPill}>
              <Text style={styles.goalCountValue}>{completedGoalsCount}/{totalGoalsCount}</Text>
              <Text style={styles.goalCountLabel}>anchors</Text>
            </View>
          </View>
          <View style={styles.streakRow}>
            <Text style={styles.streakLabel}>Consistency streak</Text>
            <Text style={styles.streakValue}>{todayProgress?.consistencyStreak || ruleState?.consistencyStreak || 0} days</Text>
          </View>
        </Card>

        <ActionGridCard anchors={anchorItems} navigation={navigation} onManualAction={handleManualAnchor} />

        <Card style={styles.goalsCard}>
          <SectionHeader title="Today's Anchors" />
          <Text style={styles.goalSummary}>{getAnchorSummary(anchorItems)}</Text>
          <View style={styles.progressList}>
            {anchorItems.map((anchor) => (
              <View key={anchor.anchorId} style={styles.anchorRowWrap}>
                <ProgressRow
                  label={anchor.label}
                  done={anchor.progressValue}
                  total={anchor.targetValue}
                  suffix={anchor.targetUnit === 'minutes' ? ' min' : ''}
                />
              </View>
            ))}
          </View>
        </Card>

        {nextSuggestion ? (
          <Card style={styles.nextCard}>
            <SectionHeader title="Next up" subtitle={nextSuggestion.label} />
            <Text style={styles.goalSummary}>The next incomplete anchor, if you want a gentle handoff.</Text>
          </Card>
        ) : null}

        {getReminderState(activeReminder) ? (
          <Card style={styles.statusCard}>
            <SectionHeader title={formatReminderTitle(activeReminder)} />
            {ruleState ? <Text style={styles.statusRate}>7-day completion rate: {ruleState.completionRate}%</Text> : null}
            <PrimaryButton
              variant="secondary"
              title="Adjust routine or reminders"
              onPress={() => navigation.navigate('Settings')}
            />
          </Card>
        ) : null}
        <Card style={styles.toolsCard}>
          <SectionHeader title="Tools" />
          <View style={styles.toolsRow}>
            <IconAction stacked icon="chart-donut" title="Weekly review" onPress={() => navigation.navigate('WeeklyReview')} />
            <IconAction stacked icon="history" title="History" onPress={() => navigation.navigate('History')} />
            <IconAction stacked icon="cog-outline" title="Settings" onPress={() => navigation.navigate('Settings')} />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  headerCard: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  streakRow: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  streakLabel: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
  },
  streakValue: {
    ...theme.typography.titleSm,
    color: theme.colors.textPrimary,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    ...theme.typography.hero,
    color: theme.colors.textPrimary,
  },
  date: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  context: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  goalCountPill: {
    minWidth: 84,
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalCountValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.primaryDark,
  },
  goalCountLabel: {
    ...theme.typography.caption,
    color: theme.colors.primaryDark,
    textTransform: 'uppercase',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  actionTile: {
    width: '48%',
    minHeight: 64,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing.sm,
    borderWidth: 1,
  },
  actionTilePrimary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  actionTileSecondary: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderSoft,
  },
  actionTilePressed: {
    opacity: 0.9,
  },
  actionText: {
    ...theme.typography.bodySm,
    lineHeight: 18,
    flex: 1,
    textAlign: 'center',
  },
  actionTextPrimary: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  actionTextSecondary: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  goalsCard: {
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  nextCard: {
    gap: theme.spacing.xs,
  },
  goalSummary: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
  },
  progressList: {
    gap: theme.spacing.md,
  },
  anchorRowWrap: {
    gap: theme.spacing.sm,
  },
  statusCard: {
    backgroundColor: theme.colors.warningSoft,
    borderColor: theme.colors.warning,
    gap: theme.spacing.sm,
  },
  statusRate: {
    ...theme.typography.bodySm,
    color: theme.colors.reminderText,
  },
  toolsCard: {
    gap: theme.spacing.sm,
  },
  toolsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
});
