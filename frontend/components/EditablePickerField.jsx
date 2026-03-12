import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import BottomSheetPicker from './BottomSheetPicker';
import { theme } from '../theme/theme';

export default function EditablePickerField({
  label,
  value,
  onChange,
  items,
  getLabel,
}) {
  const [visible, setVisible] = useState(false);

  const valueLabel = useMemo(() => {
    if (getLabel) return getLabel(value);
    return String(value);
  }, [value, getLabel]);

  return (
    <>
      <View style={styles.row}>
        <View style={styles.textWrap}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{valueLabel}</Text>
        </View>
        <Pressable style={styles.editBtn} onPress={() => setVisible(true)}>
          <Text style={styles.editText}>Edit</Text>
        </Pressable>
      </View>

      <BottomSheetPicker
        visible={visible}
        title={label}
        items={items}
        value={value}
        onChange={onChange}
        onClose={() => setVisible(false)}
        getLabel={getLabel}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  editBtn: {
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.primarySoft,
  },
  editText: {
    color: theme.colors.primaryDark,
    fontWeight: '700',
    fontSize: 13,
  },
});
