import { StyleSheet, Text, View } from 'react-native';
import AppTextInput from './AppTextInput';
import { theme } from '../theme/theme';

export default function LabeledInput({
  label,
  value,
  onChangeText,
  onEndEditing,
  onSubmitEditing,
  keyboardType = 'default',
  placeholder = '',
  maxLength,
  hideLabel = false,
  autoFocus = false,
  returnKeyType = 'done',
}) {
  return (
    <View style={styles.wrapper}>
      {!hideLabel && label ? <Text style={styles.label}>{label}</Text> : null}
      <AppTextInput
        value={value == null ? '' : String(value)}
        onChangeText={onChangeText}
        onEndEditing={onEndEditing}
        onSubmitEditing={onSubmitEditing}
        keyboardType={keyboardType}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
        returnKeyType={returnKeyType}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: theme.forms.inputLabel,
  input: theme.forms.input,
});
