import { StyleSheet, Text, View } from 'react-native';
import Card from './Card';
import { theme } from '../theme/theme';

export default function SettingsSection({ title, children, style }) {
  return (
    <View style={[styles.section, style]}>
      <Text style={styles.title}>{title}</Text>
      <Card style={styles.card}>{children}</Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: theme.spacing.sm,
  },
  title: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  card: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    gap: 0,
  },
});
