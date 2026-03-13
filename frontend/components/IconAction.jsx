import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

export default function IconAction({
  title,
  subtitle = null,
  icon,
  onPress,
  prominent = false,
  compact = false,
  stacked = false,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        stacked ? styles.stackedBase : styles.base,
        !stacked && (prominent ? styles.prominent : styles.compact),
        !stacked && (compact ? styles.compactTile : styles.prominentTile),
        pressed ? styles.pressed : null,
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          stacked ? styles.iconWrapStacked : null,
          !stacked && (prominent ? styles.iconWrapProminent : styles.iconWrapCompact),
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={stacked ? 22 : compact ? 18 : 20}
          color={prominent || stacked ? theme.colors.primary : theme.colors.textPrimary}
        />
      </View>
      <View style={[styles.textWrap, stacked ? styles.textWrapStacked : null]}>
        <Text
          style={[
            styles.title,
            compact ? styles.titleCompact : null,
            stacked ? styles.titleStacked : null,
          ]}
        >
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
  },
  stackedBase: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    minHeight: 96,
  },
  prominent: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.primarySoft,
  },
  compact: {
    backgroundColor: theme.colors.surface,
  },
  prominentTile: {
    flex: 1,
    minHeight: 90,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  compactTile: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
  },
  iconWrapProminent: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.primarySoft,
  },
  iconWrapCompact: {
    width: 32,
    height: 32,
    backgroundColor: theme.colors.iconSurface,
  },
  iconWrapStacked: {
    width: 42,
    height: 42,
    backgroundColor: theme.colors.iconSurface,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  textWrapStacked: {
    flex: 0,
    alignItems: 'center',
  },
  title: {
    ...theme.typography.titleSm,
    color: theme.colors.textPrimary,
  },
  titleCompact: {
    fontSize: 13,
  },
  titleStacked: {
    ...theme.typography.bodySm,
    textAlign: 'center',
    lineHeight: 18,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.88,
  },
});
