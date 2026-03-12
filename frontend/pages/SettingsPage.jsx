import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Card from '../components/Card';
import EditablePickerField from '../components/EditablePickerField';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { TIMEZONES } from '../data/timezones';
import { useAuth } from '../context/AuthContext';
import { useDailyGoals } from '../state/DailyGoalsContext';
import { useProfile } from '../state/ProfileContext';
import { theme } from '../theme/theme';

const toneOptions = ['direct', 'neutral', 'supportive'];

export default function SettingsPage({ navigation }) {
  const { profile, updateProfile } = useProfile();
  const { dailyGoals, saveDailyGoals } = useDailyGoals();
  const { logout } = useAuth();

  const [jobWorkMinutesGoal, setJobWorkMinutesGoal] = useState(dailyGoals?.jobWorkMinutesGoal || 60);
  const [movementMinutesGoal, setMovementMinutesGoal] = useState(dailyGoals?.movementMinutesGoal || 20);
  const [dailyJobTaskGoal, setDailyJobTaskGoal] = useState(dailyGoals?.dailyJobTaskGoal ?? true);

  const [tonePreference, setTonePreference] = useState(profile?.tonePreference || 'direct');
  const [timezone, setTimezone] = useState(
    profile?.timezone && TIMEZONES.includes(profile.timezone) ? profile.timezone : 'UTC'
  );
  const [sprintModeEnabled, setSprintModeEnabled] = useState(profile?.sprintModeEnabled || false);
  const [replayOnboarding, setReplayOnboarding] = useState(false);
  const minuteOptions = Array.from({ length: 48 }, (_, idx) => (idx + 2) * 5);
  const movementOptions = Array.from({ length: 36 }, (_, idx) => (idx + 1) * 5);

  const save = async () => {
    await saveDailyGoals({
      jobWorkMinutesGoal,
      movementMinutesGoal,
      dailyJobTaskGoal,
    });

    await updateProfile({
      tonePreference,
      timezone,
      sprintModeEnabled,
    });

    if (replayOnboarding) {
      navigation.reset({ index: 0, routes: [{ name: 'OnboardingDiscipline' }] });
      return;
    }

    navigation.goBack();
  };

  return (
    <ScreenContainer>
      <Card style={styles.card}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.identityText}>Signed in as: {profile?.email || 'Unknown user'}</Text>

        <EditablePickerField
          label="Job work minutes"
          value={jobWorkMinutesGoal}
          onChange={setJobWorkMinutesGoal}
          items={minuteOptions}
          getLabel={(item) => `${item} min`}
        />
        <EditablePickerField
          label="Movement minutes"
          value={movementMinutesGoal}
          onChange={setMovementMinutesGoal}
          items={movementOptions}
          getLabel={(item) => `${item} min`}
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Daily job task goal</Text>
          <Switch value={dailyJobTaskGoal} onValueChange={setDailyJobTaskGoal} />
        </View>

        <View style={styles.toneWrap}>
          <Text style={styles.switchLabel}>Tone preference</Text>
          <View style={styles.pillRow}>
            {toneOptions.map((tone) => {
              const active = tonePreference === tone;
              return (
                <Pressable key={tone} style={[styles.pill, active ? styles.pillActive : null]} onPress={() => setTonePreference(tone)}>
                  <Text selectable={false} style={[styles.pillText, active ? styles.pillTextActive : null]}>
                    {tone}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <EditablePickerField
          label="Timezone"
          value={timezone}
          onChange={setTimezone}
          items={TIMEZONES}
          getLabel={(item) => item}
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Sprint mode enabled</Text>
          <Switch value={sprintModeEnabled} onValueChange={setSprintModeEnabled} />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Replay onboarding after save</Text>
          <Switch value={replayOnboarding} onValueChange={setReplayOnboarding} />
        </View>
      </Card>

      <PrimaryButton title="Save settings" onPress={save} />
      <PrimaryButton
        variant="secondary"
        title="How this app works"
        onPress={() => navigation.navigate('HowItWorks')}
      />
      <PrimaryButton
        variant="secondary"
        title="Debug tools"
        onPress={() => navigation.navigate('DebugTools')}
      />
      <PrimaryButton variant="secondary" title="Cancel" onPress={() => navigation.goBack()} />
      <PrimaryButton variant="danger" title="Log out" onPress={logout} />
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  identityText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  toneWrap: {
    gap: theme.spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  pill: {
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surface,
  },
  pillActive: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primaryStrong,
  },
  pillText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  pillTextActive: {
    color: theme.colors.primaryDark,
  },
});
