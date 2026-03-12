import { StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../theme/theme';

export default function LabeledInput({ label, value, onChangeText, keyboardType = 'default' }) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={String(value)}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: theme.colors.surface,
  },
});
