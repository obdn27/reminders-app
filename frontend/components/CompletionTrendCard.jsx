import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path, Circle } from 'react-native-svg';
import Card from './Card';
import SectionHeader from './SectionHeader';
import { theme } from '../theme/theme';

function buildLinePath(points) {
  if (!points.length) return '';
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

function toY(value, chartTop, chartHeight) {
  return chartTop + chartHeight - (Math.max(0, Math.min(100, value)) / 100) * chartHeight;
}

export default function CompletionTrendCard({ history = [] }) {
  const width = 312;
  const height = 156;
  const chartLeft = 26;
  const chartRight = width - 12;
  const chartTop = 18;
  const chartHeight = 72;
  const chartWidth = chartRight - chartLeft;
  const data = [...history].reverse();
  const stepX = data.length > 1 ? chartWidth / (data.length - 1) : 0;
  const points = data.map((item, index) => ({
    x: chartLeft + stepX * index,
    y: toY(item.completionRate || 0, chartTop, chartHeight),
  }));
  const path = buildLinePath(points);

  return (
    <Card style={styles.card}>
      <SectionHeader title="Sprint Trend" subtitle="7-day anchor completion rate" />
      <View style={styles.chartWrap}>
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          {[0, 50, 100].map((tick) => {
            const y = toY(tick, chartTop, chartHeight);
            return (
              <Line
                key={String(tick)}
                x1={chartLeft}
                x2={chartRight}
                y1={y}
                y2={y}
                stroke={theme.colors.graphGrid}
                strokeWidth="1"
              />
            );
          })}
          <Path d={path} stroke={theme.colors.primary} strokeWidth="3" fill="none" strokeLinecap="round" />
          {points.map((point, index) => (
            <Circle key={String(index)} cx={point.x} cy={point.y} r="3.5" fill={theme.colors.primaryDark} />
          ))}
        </Svg>
        <View style={styles.labelsRow}>
          {data.map((item) => (
            <Text key={item.date} style={styles.dayLabel}>
              {new Date(`${item.date}T12:00:00`).toLocaleDateString([], { weekday: 'short' })}
            </Text>
          ))}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
  },
  chartWrap: {
    gap: theme.spacing.xs,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
  },
  dayLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
});
