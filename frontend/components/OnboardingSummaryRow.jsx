import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme/theme';

export default function OnboardingSummaryRow({ label, value, isLast = false }) {
  return (
    <View style={[styles.row, !isLast ? styles.divider : null]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  label: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  value: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
    flex: 1.2,
    textAlign: 'right',
  },
});

