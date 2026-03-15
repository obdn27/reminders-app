import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { formatDateParam } from '../services/timeMachine';
import { useDebugTime } from '../state/DebugTimeContext';
import { useProfile } from '../state/ProfileContext';
import { useWeeklyReview } from '../state/WeeklyReviewContext';
import { theme } from '../theme/theme';
import { goBackOrNavigateHome } from '../utils/navigation';

function getSprintDayCount(asOfDate, sprintStartDate) {
  if (!sprintStartDate) return null;
  const targetTime = new Date(`${asOfDate}T12:00:00`).getTime();
  const startTime = new Date(`${sprintStartDate}T12:00:00`).getTime();
  return Math.max(1, Math.floor((targetTime - startTime) / (1000 * 60 * 60 * 24)) + 1);
}

function formatWeekRange(review) {
  if (!review) return '';
  return `${review.weekStartDate} to ${review.weekEndDate}`;
}

function fallbackBreakdown(review) {
  if (!review) return [];
  return [
    { label: 'Days goals met', value: `${review.daysGoalsMet}/7` },
    { label: 'Longest streak', value: String(review.longestStreak) },
    { label: 'Most missed area', value: review.mostMissedAreaLabel || review.mostMissedArea },
  ];
}

export default function WeeklyReviewPage({ navigation }) {
  const { latestWeeklyReview, refreshLatestWeeklyReview } = useWeeklyReview();
  const { nowDate } = useDebugTime();
  const { profile } = useProfile();
  const asOfDate = formatDateParam(nowDate);
  const sprintDayCount = getSprintDayCount(asOfDate, profile?.sprintStartDate);

  useEffect(() => {
    refreshLatestWeeklyReview();
  }, [asOfDate]);

  const review = latestWeeklyReview;
  const anchorBreakdown = review?.anchorBreakdown?.length ? review.anchorBreakdown : fallbackBreakdown(review);
  const daysRemaining = sprintDayCount ? Math.max(0, 7 - sprintDayCount) : null;

  return (
    <ScreenContainer>
      <Card style={styles.card}>
        <Text style={styles.title}>Weekly review</Text>

        {review ? (
          <>
            <Text style={styles.weekRange}>{formatWeekRange(review)}</Text>
            <Text style={styles.summary}>{review.summaryText}</Text>

            <View style={styles.breakdownList}>
              {anchorBreakdown.map((item) => (
                <View key={item.label} style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{item.label}</Text>
                  <Text style={styles.breakdownValue}>
                    {item.daysMet != null ? `${item.daysMet} / ${item.totalDays} days met` : item.value}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.summary}>Your first weekly review will unlock after 7 sprint days.</Text>
            {sprintDayCount ? <Text style={styles.meta}>Current sprint day: {sprintDayCount}</Text> : null}
            {daysRemaining ? <Text style={styles.meta}>{daysRemaining} day{daysRemaining === 1 ? '' : 's'} remaining</Text> : null}
          </>
        )}
      </Card>

      <PrimaryButton title="Continue sprint" onPress={() => goBackOrNavigateHome(navigation)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  weekRange: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  summary: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  meta: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  breakdownList: {
    gap: theme.spacing.sm,
  },
  breakdownRow: {
    gap: 2,
  },
  breakdownLabel: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  breakdownValue: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
});
