import { StyleSheet, Text } from 'react-native';
import Card from '../components/Card';
import OnboardingChoiceCard from '../components/OnboardingChoiceCard';
import OnboardingLayout from '../components/OnboardingLayout';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { TONE_OPTIONS } from '../data/anchorCatalog';
import { useOnboarding } from '../state/OnboardingContext';
import { theme } from '../theme/theme';

export default function OnboardingTonePage({ navigation }) {
  const { state, setTonePreference } = useOnboarding();

  return (
    <ScreenContainer>
      <OnboardingLayout
        step={6}
        totalSteps={7}
        eyebrow="Tone"
        title="How should the app talk to you when things slip?"
        subtitle="Pick the tone that will actually help you re-engage instead of tuning the app out."
        footer={<PrimaryButton title="Review setup" onPress={() => navigation.navigate('OnboardingSummary')} />}
      >
        {TONE_OPTIONS.map((option) => (
          <OnboardingChoiceCard
            key={option.value}
            icon={option.value === 'direct' ? 'flash-outline' : option.value === 'neutral' ? 'swap-horizontal' : 'hand-heart-outline'}
            title={option.title}
            description={option.example}
            selected={state.tonePreference === option.value}
            onPress={() => setTonePreference(option.value)}
          />
        ))}
        <Card>
          <Text style={styles.note}>The tone can be changed later in Settings.</Text>
        </Card>
      </OnboardingLayout>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  note: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});

