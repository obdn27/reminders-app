import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

export default function OnboardingChoiceCard({
  icon,
  title,
  description,
  selected = false,
  badge = null,
  onPress,
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, selected ? styles.selected : null, pressed ? styles.pressed : null]}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, selected ? styles.iconWrapSelected : null]}>
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={selected ? theme.colors.primaryDark : theme.colors.textSecondary}
          />
        </View>
        {badge ? <Text style={styles.badge}>{badge}</Text> : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  pressed: {
    opacity: 0.92,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.iconSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: {
    backgroundColor: theme.colors.primary,
  },
  badge: {
    ...theme.typography.caption,
    color: theme.colors.primaryDark,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
  },
  body: {
    gap: theme.spacing.xs,
  },
  title: {
    ...theme.typography.titleSm,
    color: theme.colors.textPrimary,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});

