import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Card from '../components/Card';
import ReviewRing from '../components/ReviewRing';
import SecondaryButton from '../components/SecondaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { formatDateParam } from '../services/timeMachine';
import { useWeeklyReview } from '../state/WeeklyReviewContext';
import { useDebugTime } from '../state/DebugTimeContext';
import { theme } from '../theme/theme';
import { goBackOrNavigateHome } from '../utils/navigation';

export default function WeeklyReviewPage({ navigation }) {
  const {
    latestWeeklyReview,
    weeklyReviewHistory,
    refreshLatestWeeklyReview,
    refreshWeeklyReviewHistory,
  } = useWeeklyReview();
  const { nowDate } = useDebugTime();
  const asOfDate = formatDateParam(nowDate);

  useEffect(() => {
    refreshLatestWeeklyReview();
    refreshWeeklyReviewHistory();
  }, [asOfDate]);

  const review = latestWeeklyReview;

  return (
    <ScreenContainer>
      <Card style={styles.card}>
        <Text style={styles.title}>Weekly review</Text>
        {review ? (
          <>
            <View style={styles.ringWrap}>
              <ReviewRing value={review.daysGoalsMet} total={7} />
            </View>
            <Text style={styles.metric}>
              Week: {review.weekStartDate} to {review.weekEndDate}
            </Text>
            <Text style={styles.metric}>Days goals met: {review.daysGoalsMet}/7</Text>
            <Text style={styles.metric}>Longest streak: {review.longestStreak}</Text>
            <Text style={styles.metric}>Most missed area: {review.mostMissedArea}</Text>
            <Text style={styles.metric}>Drift detected: {review.driftDetected ? 'Yes' : 'No'}</Text>
            <Text style={styles.summary}>{review.summaryText}</Text>
          </>
        ) : (
          <Text style={styles.summary}>No weekly review available yet.</Text>
        )}
      </Card>

      {weeklyReviewHistory.length > 1 ? (
        <Card style={styles.card}>
          <Text style={styles.title}>History</Text>
          <View style={styles.historyList}>
            {weeklyReviewHistory.slice(1, 5).map((item) => (
              <Text key={item.id} style={styles.historyItem}>
                {item.weekStartDate} to {item.weekEndDate} · {item.daysGoalsMet}/7
              </Text>
            ))}
          </View>
        </Card>
      ) : null}
      <SecondaryButton title="Return home" onPress={() => goBackOrNavigateHome(navigation)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  title: { fontSize: 22, fontWeight: '700', color: theme.colors.textPrimary },
  ringWrap: { alignItems: 'center', marginBottom: 6 },
  metric: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: '600' },
  summary: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 15, lineHeight: 22 },
  historyList: { gap: 6 },
  historyItem: { color: theme.colors.textSecondary, fontSize: 14 },
});
