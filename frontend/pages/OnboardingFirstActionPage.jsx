import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { theme } from '../theme/theme';

export default function OnboardingFirstActionPage({ navigation }) {
  return (
    <ScreenContainer scroll={false}>
      <View style={styles.wrapper}>
        <Card style={styles.heroCard}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="timer-outline" size={28} color={theme.colors.primaryDark} />
          </View>
          <Text style={styles.title}>Your sprint is set.</Text>
          <Text style={styles.copy}>
            The cleanest way to start is to log one focused block now. You do not need a perfect day, just a real first step.
          </Text>
        </Card>
        <View style={styles.actions}>
          <PrimaryButton title="Start first focus session" onPress={() => navigation.replace('StartFocusSession')} />
          <PrimaryButton variant="secondary" title="Go to home" onPress={() => navigation.replace('Home')} />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  heroCard: {
    gap: theme.spacing.lg,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  title: {
    ...theme.typography.hero,
    color: theme.colors.textPrimary,
  },
  copy: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  actions: {
    gap: theme.spacing.md,
  },
});

