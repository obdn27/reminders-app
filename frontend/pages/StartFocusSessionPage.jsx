import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Card from '../components/Card';
import EditablePickerField from '../components/EditablePickerField';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { useSessionState } from '../state/SessionContext';
import { theme } from '../theme/theme';

const categories = ['applications', 'project', 'DSA', 'admin'];
const presets = [3, 25, 45, 60];

function SelectRow({ values, selected, onSelect }) {
  return (
    <View style={styles.selectRow}>
      {values.map((item) => {
        const key = String(item);
        const active = selected === item;
        return (
          <Pressable key={key} onPress={() => onSelect(item)} style={[styles.optionChip, active ? styles.optionChipActive : null]}>
            <Text selectable={false} style={[styles.optionChipText, active ? styles.optionChipTextActive : null]}>
              {key}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function StartFocusSessionPage({ navigation }) {
  const { startFocusSession } = useSessionState();
  const [category, setCategory] = useState('applications');
  const [duration, setDuration] = useState(25);
  const durationOptions = Array.from({ length: 48 }, (_, idx) => (idx + 1) * 5);

  const start = () => {
    const safeDuration = Math.min(240, Math.max(1, Number(duration) || 25));
    startFocusSession({ category, durationMinutes: safeDuration });
    navigation.navigate('ActiveSession');
  };

  return (
    <ScreenContainer>
      <Card style={styles.card}>
        <Text style={styles.title}>Start focus session</Text>
        <Text style={styles.label}>Category</Text>
        <SelectRow values={categories} selected={category} onSelect={setCategory} />

        <Text style={styles.label}>Duration presets (mins)</Text>
        <SelectRow values={presets} selected={duration} onSelect={setDuration} />

        <EditablePickerField
          label="Duration wheel"
          value={duration}
          onChange={setDuration}
          items={durationOptions}
          getLabel={(item) => `${item} min`}
        />
      </Card>

      <PrimaryButton title="Start session" onPress={start} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  title: { fontSize: 22, fontWeight: '700', color: theme.colors.textPrimary },
  label: { marginTop: 2, fontSize: 15, fontWeight: '600', color: theme.colors.textSecondary },
  selectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  optionChipText: {
    color: theme.colors.textSecondary,
  },
  optionChipActive: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primaryStrong,
  },
  optionChipTextActive: {
    color: theme.colors.primaryDark,
    fontWeight: '700',
  },
});
