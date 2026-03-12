import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../theme/theme';

export default function PrimaryButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
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
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === 'secondary' ? styles.secondaryLabel : styles.primaryLabel,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
    fontSize: 16,
    fontWeight: '600',
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
});
