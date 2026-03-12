import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Card from '../components/Card';
import EditablePickerField from '../components/EditablePickerField';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { useDailyGoals } from '../state/DailyGoalsContext';
import { useSessionState } from '../state/SessionContext';
import { theme } from '../theme/theme';

const categories = ['walk', 'run', 'mobility', 'workout'];
const presets = [10, 20, 30, 45];

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

export default function StartMovementSessionPage({ navigation }) {
  const { startMovementSession } = useSessionState();
  const { dailyGoals } = useDailyGoals();

  const [category, setCategory] = useState('walk');
  const [duration, setDuration] = useState(dailyGoals?.movementMinutesGoal || 20);
  const durationOptions = Array.from({ length: 36 }, (_, idx) => (idx + 1) * 5);

  const start = () => {
    const safeDuration = Math.min(180, Math.max(1, Number(duration) || 20));

    startMovementSession({ category, durationMinutes: safeDuration });
    navigation.navigate('ActiveSession');
  };

  return (
    <ScreenContainer>
      <Card style={styles.card}>
        <Text style={styles.title}>Start movement session</Text>

        <Text style={styles.label}>Type</Text>
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

      <PrimaryButton title="Start movement session" onPress={start} />
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
