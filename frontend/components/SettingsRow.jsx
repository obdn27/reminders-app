import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

export function SettingsRow({
  label,
  value = null,
  helper = null,
  onPress = null,
  right = null,
  showChevron = false,
  isLast = false,
  icon = null,
}) {
  const content = (
    <View style={[styles.row, !isLast ? styles.rowDivider : null]}>
      <View style={styles.textWrap}>
        <View style={styles.labelRow}>
          {icon ? (
            <MaterialCommunityIcons
              name={icon}
              size={16}
              color={theme.colors.textSecondary}
            />
          ) : null}
          <Text style={styles.label}>{label}</Text>
        </View>
        {helper ? <Text style={styles.helper}>{helper}</Text> : null}
      </View>
      <View style={styles.rightWrap}>
        {value ? <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">{value}</Text> : null}
        {right}
        {showChevron ? (
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={theme.colors.textMuted}
          />
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => (pressed ? styles.pressed : null)}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  row: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  textWrap: {
    flex: 1,
    gap: 2,
    paddingVertical: theme.spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
  },
  helper: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
  },
  rightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    maxWidth: '58%',
  },
  value: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.88,
  },
});
