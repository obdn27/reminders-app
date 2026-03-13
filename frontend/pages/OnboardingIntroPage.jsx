import { StyleSheet, Text, View } from 'react-native';
import Card from '../components/Card';
import OnboardingLayout from '../components/OnboardingLayout';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { theme } from '../theme/theme';

export default function OnboardingIntroPage({ navigation }) {
  return (
    <ScreenContainer>
      <OnboardingLayout
        step={1}
        totalSteps={7}
        eyebrow="Rebuild structure"
        title="When life gets chaotic, discipline is usually the first thing to slip."
        subtitle="This app helps you rebuild a few daily anchors so stressful periods feel structured again instead of shapeless."
        footer={
          <>
            <PrimaryButton title="Build my routine" onPress={() => navigation.navigate('OnboardingGoalContext')} />
            <PrimaryButton variant="secondary" title="How this app works" onPress={() => navigation.navigate('HowItWorks')} />
          </>
        }
      >
        <Card>
          <View style={styles.list}>
            <Text style={styles.listItem}>A few daily anchors matter more than a giant perfect plan.</Text>
            <Text style={styles.listItem}>You set realistic minimums, not heroic ones.</Text>
            <Text style={styles.listItem}>The app checks for drift and helps you recover early.</Text>
          </View>
        </Card>
      </OnboardingLayout>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: theme.spacing.md,
  },
  listItem: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
});

