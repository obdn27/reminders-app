import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { useWeeklyReview } from '../state/WeeklyReviewContext';
import { generateWeeklyReview } from '../services/api';
import { theme } from '../theme/theme';
import { goBackOrNavigateHome } from '../utils/navigation';

export default function WeeklyReviewPage({ navigation }) {
  const {
    latestWeeklyReview,
    weeklyReviewHistory,
    refreshLatestWeeklyReview,
    refreshWeeklyReviewHistory,
  } = useWeeklyReview();

  useEffect(() => {
    refreshLatestWeeklyReview();
    refreshWeeklyReviewHistory();
  }, []);

  const review = latestWeeklyReview;
  const today = new Date();
  const dayIndex = today.getDay();
  const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;
  const start = new Date(today);
  start.setDate(today.getDate() + mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const thisWeekStart = start.toISOString().slice(0, 10);
  const thisWeekEnd = end.toISOString().slice(0, 10);
  const hasCurrentWeekReview =
    review?.weekStartDate === thisWeekStart && review?.weekEndDate === thisWeekEnd;

  return (
    <ScreenContainer>
      <Card style={styles.card}>
        <Text style={styles.title}>Weekly review</Text>
        {review ? (
          <>
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

      {!hasCurrentWeekReview ? (
        <PrimaryButton
          title="Generate this week's review"
          onPress={async () => {
            await generateWeeklyReview();
            await refreshLatestWeeklyReview();
            await refreshWeeklyReviewHistory();
          }}
        />
      ) : null}
      <SecondaryButton title="Return home" onPress={() => goBackOrNavigateHome(navigation)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  title: { fontSize: 22, fontWeight: '700', color: theme.colors.textPrimary },
  metric: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: '600' },
  summary: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 15, lineHeight: 22 },
  historyList: { gap: 6 },
  historyItem: { color: theme.colors.textSecondary, fontSize: 14 },
});
