import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import Card from './Card';
import SectionHeader from './SectionHeader';
import { theme } from '../theme/theme';

const GRID_LEVELS = [0, 50, 100, 150];

function formatDayLabel(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2);
}

function clampPercent(value) {
  return Math.max(0, Math.min(150, value));
}

function buildLine(points) {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

function toY(percent, paddingY, usableHeight) {
  return paddingY + usableHeight - (usableHeight * clampPercent(percent)) / 150;
}

function getPercent(numerator, denominator) {
  if (!denominator) {
    return 0;
  }
  return (numerator / denominator) * 100;
}

export default function HistoryLineGraph({
  title = null,
  subtitle = null,
  history = [],
  dailyGoals = null,
  compact = false,
}) {
  const rows = history.slice(0, 7).reverse();
  const width = 340;
  const chartHeight = compact ? 92 : 168;
  const paddingX = 32;
  const paddingY = compact ? 10 : 18;
  const usableWidth = width - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;
  const jobGoal = dailyGoals?.jobWorkMinutesGoal || 60;
  const movementGoal = dailyGoals?.movementMinutesGoal || 20;

  const points = rows.map((item, index) => {
    const x = paddingX + (rows.length <= 1 ? usableWidth / 2 : (usableWidth / (rows.length - 1)) * index);
    const jobPercent = getPercent(item.jobWorkMinutesCompleted, jobGoal);
    const movementPercent = getPercent(item.movementMinutesCompleted, movementGoal);
    return {
      x,
      item,
      jobPercent,
      movementPercent,
      jobY: toY(jobPercent, paddingY, usableHeight),
      movementY: toY(movementPercent, paddingY, usableHeight),
    };
  });
  const axisLevels = GRID_LEVELS.map((level) => ({
    level,
    y: toY(level, paddingY, usableHeight),
  }));

  return (
    <Card style={styles.card}>
      {title || subtitle ? <SectionHeader title={title} subtitle={subtitle} /> : null}
      {rows.length ? (
        <>
          {!compact ? (
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendSwatch, styles.jobSwatch]} />
                <Text style={styles.legendText}>Job work %</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendSwatch, styles.movementSwatch]} />
                <Text style={styles.legendText}>Movement %</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendSwatch, styles.targetSwatch]} />
                <Text style={styles.legendText}>Target</Text>
              </View>
            </View>
          ) : null}

          <View style={[styles.graphWrap, compact ? styles.graphWrapCompact : null]}>
            <Svg width="100%" height={chartHeight} viewBox={`0 0 ${width} ${chartHeight}`}>
              {GRID_LEVELS.map((level) => {
                const y = toY(level, paddingY, usableHeight);
                return (
                  <Line
                    key={`grid-${level}`}
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke={level === 100 ? theme.colors.primaryStrong : theme.colors.graphGrid}
                    strokeDasharray={level === 100 ? '6 4' : undefined}
                    strokeWidth="1"
                  />
                );
              })}

              <Polyline
                points={buildLine(points.map((point) => ({ x: point.x, y: point.jobY })))}
                fill="none"
                stroke={theme.colors.primaryStrong}
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <Polyline
                points={buildLine(points.map((point) => ({ x: point.x, y: point.movementY })))}
                fill="none"
                stroke={theme.colors.success}
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray="8 5"
              />

              {points.map((point) => (
                <Circle
                  key={`job-${point.item.id}`}
                  cx={point.x}
                  cy={point.jobY}
                  r={compact ? '3' : '4'}
                  fill={theme.colors.surface}
                  stroke={theme.colors.primaryStrong}
                  strokeWidth="2"
                />
              ))}
              {points.map((point) => (
                <Circle
                  key={`movement-${point.item.id}`}
                  cx={point.x}
                  cy={point.movementY}
                  r={compact ? '3' : '4'}
                  fill={theme.colors.surface}
                  stroke={theme.colors.success}
                  strokeWidth="2"
                />
              ))}
            </Svg>

            <View style={styles.leftAxis}>
              {axisLevels.map(({ level, y }) => (
                <Text key={`left-${level}`} style={[styles.axisLabel, { top: y - 8 }]}>
                  {level}%
                </Text>
              ))}
            </View>
            <View style={styles.rightAxis}>
              {axisLevels.map(({ level, y }) => (
                <Text key={`right-${level}`} style={[styles.axisLabel, { top: y - 8 }]}>
                  {level}%
                </Text>
              ))}
            </View>
          </View>

          <View style={styles.labelRow}>
            {rows.map((item) => (
              <Text key={`label-${item.id}`} style={styles.dayLabel}>
                {formatDayLabel(item.date)}
              </Text>
            ))}
          </View>

          <View style={[styles.taskWrap, compact ? styles.taskWrapCompact : null]}>
            <Text style={styles.taskTitle}>Daily job task completion</Text>
            <View style={styles.taskRow}>
              {rows.map((item) => {
                const complete = Boolean(item.jobTaskCompleted);
                return (
                  <View key={`task-${item.id}`} style={styles.taskItem}>
                    <Text
                      style={[
                        styles.taskIcon,
                        compact ? styles.taskIconCompact : null,
                        complete ? styles.taskIconDone : styles.taskIconMissed,
                      ]}
                    >
                      {complete ? '✓' : '○'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </>
      ) : (
        <Text style={styles.emptyText}>No sprint history available yet.</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  legendSwatch: {
    width: 18,
    height: 4,
    borderRadius: theme.radius.pill,
  },
  jobSwatch: {
    backgroundColor: theme.colors.primaryStrong,
  },
  movementSwatch: {
    backgroundColor: theme.colors.success,
  },
  targetSwatch: {
    backgroundColor: theme.colors.textMuted,
  },
  legendText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  graphWrap: {
    height: 168,
    justifyContent: 'center',
  },
  graphWrapCompact: {
    height: 92,
  },
  leftAxis: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  rightAxis: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'flex-end',
  },
  axisLabel: {
    position: 'absolute',
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },
  dayLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  taskWrap: {
    gap: theme.spacing.sm,
  },
  taskWrapCompact: {
    gap: 2,
  },
  taskTitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  taskItem: {
    alignItems: 'center',
    flex: 1,
  },
  taskIcon: {
    fontSize: 18,
    fontWeight: '800',
  },
  taskIconCompact: {
    fontSize: 14,
  },
  taskIconDone: {
    color: theme.colors.success,
  },
  taskIconMissed: {
    color: theme.colors.textMuted,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
});
