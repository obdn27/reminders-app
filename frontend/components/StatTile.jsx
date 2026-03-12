import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme/theme';

export default function StatTile({ label, value, helper }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 120,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  label: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  value: {
    fontSize: 22,
    color: theme.colors.textPrimary,
    fontWeight: '800',
  },
  helper: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});
