import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../theme/theme';

export default function HeaderActionButton({ title, onPress, disabled = false }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.button, pressed ? styles.pressed : null, disabled ? styles.disabled : null]}
    >
      <Text style={styles.label}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 32,
    paddingHorizontal: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...theme.typography.bodySm,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.5,
  },
});
