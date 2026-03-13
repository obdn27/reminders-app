import { useState } from 'react';
import BottomSheetTimePicker from './BottomSheetTimePicker';
import { SettingsRow } from './SettingsRow';
import { formatReminderTime } from '../data/reminderTimes';

export default function TimePickerField({ label, value, onChange, isLast = false }) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <SettingsRow
        label={label}
        value={formatReminderTime(value)}
        onPress={() => setVisible(true)}
        showChevron
        isLast={isLast}
      />

      <BottomSheetTimePicker
        visible={visible}
        title={label}
        value={value}
        onChange={onChange}
        onClose={() => setVisible(false)}
      />
    </>
  );
}
