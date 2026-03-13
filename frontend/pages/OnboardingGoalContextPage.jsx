import { StyleSheet, Text } from 'react-native';
import OnboardingChoiceCard from '../components/OnboardingChoiceCard';
import OnboardingLayout from '../components/OnboardingLayout';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { GOAL_CONTEXT_OPTIONS } from '../data/anchorCatalog';
import { useOnboarding } from '../state/OnboardingContext';
import { theme } from '../theme/theme';

export default function OnboardingGoalContextPage({ navigation }) {
  const { state, setGoalContext } = useOnboarding();

  return (
    <ScreenContainer>
      <OnboardingLayout
        step={2}
        totalSteps={7}
        eyebrow="Current context"
        title="What are you trying to hold together right now?"
        subtitle="Pick the main context for this sprint. It frames the reminders and keeps the setup grounded."
        footer={
          <PrimaryButton
            title="Continue"
            onPress={() => navigation.navigate('OnboardingAnchorSelection')}
            disabled={!state.goalContext}
          />
        }
      >
        {GOAL_CONTEXT_OPTIONS.map((option) => (
          <OnboardingChoiceCard
            key={option.value}
            icon={option.icon}
            title={option.title}
            description={option.description}
            selected={state.goalContext === option.value}
            onPress={() => setGoalContext(option.value)}
          />
        ))}
        <Text style={styles.footerNote}>You can refine the routine after setup. This just sets the frame.</Text>
      </OnboardingLayout>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  footerNote: {
    ...theme.typography.bodySm,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});

