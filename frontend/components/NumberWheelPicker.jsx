import { StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { theme } from '../theme/theme';

export default function NumberWheelPicker({
  label,
  value,
  onChange,
  min = 1,
  max = 120,
  step = 1,
  suffix = '',
}) {
  const options = [];
  for (let current = min; current <= max; current += step) {
    options.push(current);
  }

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.pickerWrap}>
        <Picker selectedValue={value} onValueChange={onChange} style={styles.picker} itemStyle={styles.itemStyle}>
          {options.map((option) => (
            <Picker.Item key={String(option)} label={`${option}${suffix}`} value={option} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    minHeight: 120,
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
  },
  itemStyle: {
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
});
