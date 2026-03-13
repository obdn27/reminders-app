import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { formatDateParam } from '../services/timeMachine';
import { useDailyGoals } from '../state/DailyGoalsContext';
import { useDebugTime } from '../state/DebugTimeContext';
import { useProfile } from '../state/ProfileContext';
import { theme } from '../theme/theme';

const sprintOptions = [30, 60, 90];
const toneOptions = ['direct', 'neutral', 'supportive'];

function OptionChips({ options, selected, onSelect }) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const isSelected = selected === option;
        return (
          <Pressable
            key={String(option)}
            style={[styles.chip, isSelected ? styles.chipSelected : null]}
            onPress={() => onSelect(option)}
          >
            <Text
              selectable={false}
              style={[styles.chipText, isSelected ? styles.chipTextSelected : null]}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function OnboardingSprintSetupPage({ navigation, route }) {
  const { nowDate } = useDebugTime();
  const { updateProfile } = useProfile();
  const { saveDailyGoals } = useDailyGoals();

  const dailyGoalsFromPrev = route.params?.dailyGoals || {
    jobWorkMinutesGoal: 60,
    movementMinutesGoal: 20,
    dailyJobTaskGoal: true,
  };

  const [sprintLength, setSprintLength] = useState(60);
  const [tone, setTone] = useState('direct');
  const [saving, setSaving] = useState(false);

  const finishSetup = async () => {
    setSaving(true);
    try {
      const start = new Date(nowDate);
      const end = new Date(start);
      end.setDate(end.getDate() + sprintLength);

      await saveDailyGoals(dailyGoalsFromPrev);
      await updateProfile({
        tonePreference: tone,
        sprintModeEnabled: true,
        sprintStartDate: formatDateParam(start),
        sprintEndDate: formatDateParam(end),
        hasCompletedOnboarding: true,
      });

      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer>
      <Card style={styles.card}>
        <Text style={styles.title}>Sprint setup</Text>

        <Text style={styles.label}>Sprint length</Text>
        <OptionChips options={sprintOptions} selected={sprintLength} onSelect={setSprintLength} />

        <Text style={styles.label}>Tone</Text>
        <OptionChips options={toneOptions} selected={tone} onSelect={setTone} />
      </Card>

      <PrimaryButton title={saving ? 'Saving...' : 'Finish setup'} onPress={finishSetup} disabled={saving} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  chipText: {
    color: theme.colors.textSecondary,
  },
  chipSelected: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primaryStrong,
  },
  chipTextSelected: {
    color: theme.colors.primaryDark,
    fontWeight: '700',
  },
});
