import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../components/Card';
import CompletionTrendCard from '../components/CompletionTrendCard';
import IconAction from '../components/IconAction';
import PrimaryButton from '../components/PrimaryButton';
import ProgressRow from '../components/ProgressRow';
import SectionHeader from '../components/SectionHeader';
import { getAnchorProgressHistory } from '../services/api';
import { formatDateParam } from '../services/timeMachine';
import { GOAL_CONTEXT_OPTIONS } from '../data/anchorCatalog';
import { useAnchors } from '../state/AnchorsContext';
import { useAnchorProgress } from '../state/AnchorProgressContext';
import { useDebugTime } from '../state/DebugTimeContext';
import { useProfile } from '../state/ProfileContext';
import { useReminders } from '../state/ReminderContext';
import { useTodayProgress } from '../state/TodayProgressContext';
import { theme } from '../theme/theme';

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
  if (incomplete.length === 1) return `${incomplete[0].title} is left.`;
  return `${incomplete.length} anchors still need attention today.`;
}

function SessionActionBar({ anchors, navigation }) {
  if (!anchors.length) {
    return null;
  }

  return (
    <View style={styles.stickyWrap}>
      <View style={styles.stickyBar}>
        {anchors.map((anchor) => {
          const isMovement = anchor.anchorType === 'movement';
          const routeName = isMovement ? 'StartMovementSession' : 'StartFocusSession';
          const buttonTitle =
            anchor.anchorType === 'movement' ? 'Start move session' : `Start ${anchor.title.toLowerCase()}`;

          return (
            <PrimaryButton
              key={anchor.anchorId}
              title={buttonTitle}
              icon={isMovement ? 'run-fast' : 'timer-outline'}
              onPress={() =>
                navigation.navigate(routeName, {
                  anchorType: anchor.anchorType,
                  anchorTitle: anchor.title,
                  defaultDuration: anchor.targetUnit === 'minutes' ? anchor.targetValue : 30,
                })
              }
              style={styles.stickyActionButton}
              labelStyle={styles.stickyActionLabel}
            />
          );
        })}
      </View>
      <LinearGradient
        pointerEvents="none"
        colors={[theme.colors.background, 'rgba(15, 17, 23, 0.82)', 'rgba(15, 17, 23, 0)']}
        locations={[0, 0.45, 1]}
        style={styles.stickyFade}
      />
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
  const { ruleState, refreshTodayProgress } = useTodayProgress();
  const [trendHistory, setTrendHistory] = useState([]);

  const loadHome = useCallback(async () => {
    await fetchAnchors();
    await refreshTodayAnchors();
    await refreshTodayProgress();
    await refreshLatestReminder();
    const trendResult = await getAnchorProgressHistory(7);
    setTrendHistory(trendResult.history || []);
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
  const sessionAnchors = anchorItems.filter((anchor) => anchor.trackingType === 'session');

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
        stickyHeaderIndices={sessionAnchors.length ? [1] : []}
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
        </Card>

        <SessionActionBar anchors={sessionAnchors} navigation={navigation} />

        <Card style={styles.goalsCard}>
          <SectionHeader title="Today's Anchors" />
          <Text style={styles.goalSummary}>{getAnchorSummary(anchorItems)}</Text>
          <View style={styles.progressList}>
            {anchorItems.map((anchor) => (
              <View key={anchor.anchorId} style={styles.anchorRowWrap}>
                <ProgressRow
                  label={anchor.title}
                  done={anchor.progressValue}
                  total={anchor.targetValue}
                  suffix={anchor.targetUnit === 'minutes' ? ' min' : ''}
                />
                {anchor.trackingType !== 'session' && !anchor.completed ? (
                  <PrimaryButton
                    variant="secondary"
                    title={anchor.trackingType === 'count' ? 'Add 1' : 'Mark complete'}
                    onPress={() => handleManualAnchor(anchor)}
                    style={styles.inlineAction}
                  />
                ) : null}
              </View>
            ))}
          </View>
        </Card>

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

        <CompletionTrendCard history={trendHistory} />

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
  stickyWrap: {
    backgroundColor: theme.colors.background,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  stickyBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  stickyFade: {
    position: 'absolute',
    left: -theme.spacing.lg,
    right: -theme.spacing.lg,
    bottom: -theme.spacing.md,
    height: 28,
  },
  stickyActionButton: {
    minWidth: '48%',
    flexGrow: 1,
    paddingVertical: 14,
    minHeight: 60,
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  stickyActionLabel: {
    ...theme.typography.label,
  },
  goalsCard: {
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
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
  inlineAction: {
    alignSelf: 'flex-start',
    minHeight: 40,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
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
