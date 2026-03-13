import { StyleSheet, Text, View } from 'react-native';
import Card from './Card';
import SectionHeader from './SectionHeader';
import { theme } from '../theme/theme';

function dayLabel(isoDate) {
  const d = new Date(isoDate);
  return d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2);
}

export default function TrendGraphCard({ history = [] }) {
  const seven = history.slice(0, 7).reverse();

  return (
    <Card style={styles.card}>
      <SectionHeader title="7-Day Trend" subtitle="Goal completion ratio" />
      <View style={styles.graphRow}>
        {seven.map((item) => {
          const total = 3;
          const met =
            (item.jobWorkMinutesCompleted > 0 ? 1 : 0) +
            (item.movementMinutesCompleted > 0 ? 1 : 0) +
            (item.jobTaskCompleted ? 1 : 0);
          const ratio = Math.max(0.1, Math.min(1, met / total));

          return (
            <View key={String(item.id)} style={styles.barWrap}>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: `${ratio * 100}%` }]} />
              </View>
              <Text style={styles.barLabel}>{dayLabel(item.date)}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.caption}>Scroll down to inspect details in History.</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
  },
  graphRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    height: 140,
    paddingTop: theme.spacing.sm,
  },
  barWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  barTrack: {
    width: '70%',
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#E7EDF7',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#2D7FF9',
    borderRadius: 10,
  },
  barLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '700',
  },
  caption: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
});
