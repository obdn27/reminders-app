import { useMemo, useState } from 'react';
import BottomSheetPicker from './BottomSheetPicker';
import { SettingsRow } from './SettingsRow';

export default function EditablePickerField({
  label,
  value,
  onChange,
  items,
  getLabel,
  isLast = false,
}) {
  const [visible, setVisible] = useState(false);

  const valueLabel = useMemo(() => {
    if (getLabel) return getLabel(value);
    return String(value);
  }, [value, getLabel]);

  return (
    <>
      <SettingsRow
        label={label}
        value={valueLabel}
        onPress={() => setVisible(true)}
        showChevron
        isLast={isLast}
      />

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
