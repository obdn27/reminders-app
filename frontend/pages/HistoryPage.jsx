import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import SectionHeader from '../components/SectionHeader';
import { getDailyProgressHistory } from '../services/api';
import { useDebugTime } from '../state/DebugTimeContext';
import { theme } from '../theme/theme';
import { goBackOrNavigateHome } from '../utils/navigation';

function statusLabel(status) {
  if (status === 'complete') return 'Goals met';
  if (status === 'on_track') return 'On track';
  if (status === 'behind') return 'Missed';
  return 'Inactive';
}

export default function HistoryPage({ navigation }) {
  const { nowDate } = useDebugTime();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const result = await getDailyProgressHistory(30);
      setHistory(result.history || []);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [nowDate])
  );

  return (
    <ScreenContainer>
      <SectionHeader
        title="Daily History"
        subtitle="Last 30 days"
        right={<Text style={styles.meta}>{loading ? 'Loading...' : `${history.length} days`}</Text>}
      />

      {history.map((item) => (
        <Card key={item.id} style={styles.rowCard}>
          <View style={styles.rowHeader}>
            <Text style={styles.date}>{item.date}</Text>
            <Text style={styles.status}>{statusLabel(item.overallStatus)}</Text>
          </View>
          <Text style={styles.line}>Job work: {item.jobWorkMinutesCompleted} min</Text>
          <Text style={styles.line}>Movement: {item.movementMinutesCompleted} min</Text>
          <Text style={styles.line}>Job task: {item.jobTaskCompleted ? 'Completed' : 'Not completed'}</Text>
        </Card>
      ))}

      {!loading && history.length === 0 ? (
        <Card>
          <Text style={styles.empty}>No history yet. Complete a session to start tracking.</Text>
        </Card>
      ) : null}

      <PrimaryButton title="Return Home" onPress={() => goBackOrNavigateHome(navigation)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  meta: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  rowCard: {
    gap: theme.spacing.sm,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  status: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  line: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  empty: {
    color: theme.colors.textMuted,
    fontSize: 15,
  },
});
