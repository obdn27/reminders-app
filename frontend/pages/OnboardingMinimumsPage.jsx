import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import Card from '../components/Card';
import EditablePickerField from '../components/EditablePickerField';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { theme } from '../theme/theme';

export default function OnboardingMinimumsPage({ navigation }) {
  const [jobWorkMinutesGoal, setJobWorkMinutesGoal] = useState(60);
  const [movementMinutesGoal, setMovementMinutesGoal] = useState(20);
  const [dailyJobTaskGoal, setDailyJobTaskGoal] = useState(true);
  const minuteOptions = Array.from({ length: 48 }, (_, idx) => (idx + 2) * 5);
  const movementOptions = Array.from({ length: 36 }, (_, idx) => (idx + 1) * 5);

  const onContinue = () => {
    navigation.navigate('OnboardingSprintSetup', {
      dailyGoals: {
        jobWorkMinutesGoal,
        movementMinutesGoal,
        dailyJobTaskGoal,
      },
    });
  };

  return (
    <ScreenContainer>
      <Card style={styles.card}>
        <Text style={styles.title}>Choose your daily minimums</Text>
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
        <View style={styles.row}>
          <Text style={styles.rowLabel}>One job-related task per day</Text>
          <Switch value={dailyJobTaskGoal} onValueChange={setDailyJobTaskGoal} />
        </View>
      </Card>

      <PrimaryButton title="Continue" onPress={onContinue} />
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
  row: {
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    flex: 1,
    marginRight: 10,
    color: theme.colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
