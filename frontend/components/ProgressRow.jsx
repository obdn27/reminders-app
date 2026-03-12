import { StyleSheet, Text, View } from 'react-native';
import ProgressBar from './ProgressBar';
import { theme } from '../theme/theme';

export default function ProgressRow({ label, done, total, suffix = '' }) {
  const safeTotal = Math.max(1, total);

  return (
    <View style={styles.wrapper}>
      <View style={styles.textRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {done}/{total}
          {suffix}
        </Text>
      </View>
      <ProgressBar value={done} max={safeTotal} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
});
