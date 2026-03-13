import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

export default function PrimaryButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  labelStyle,
  icon,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'secondary' ? styles.secondary : styles.primary,
        variant === 'danger' ? styles.danger : null,
        pressed ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <View style={styles.content}>
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={variant === 'secondary' ? theme.colors.textPrimary : theme.colors.surface}
          />
        ) : null}
        <Text
          style={[
            styles.label,
            variant === 'secondary' ? styles.secondaryLabel : styles.primaryLabel,
            labelStyle,
          ]}
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 48,
  },
  primary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSoft,
  },
  danger: {
    backgroundColor: theme.colors.danger,
    borderColor: theme.colors.danger,
  },
  label: {
    ...theme.typography.label,
  },
  primaryLabel: {
    color: theme.colors.surface,
  },
  secondaryLabel: {
    color: theme.colors.textPrimary,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
});
