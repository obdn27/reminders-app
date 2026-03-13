import { StyleSheet, Text } from 'react-native';
import OnboardingChoiceCard from '../components/OnboardingChoiceCard';
import OnboardingLayout from '../components/OnboardingLayout';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { ANCHOR_CATALOG } from '../data/anchorCatalog';
import { useOnboarding } from '../state/OnboardingContext';
import { theme } from '../theme/theme';

export default function OnboardingAnchorSelectionPage({ navigation }) {
  const { state, toggleAnchor } = useOnboarding();
  const selectedCount = state.selectedAnchors.length;
  const canContinue = selectedCount >= 2 && selectedCount <= 4;

  return (
    <ScreenContainer>
      <OnboardingLayout
        step={3}
        totalSteps={7}
        eyebrow="Daily anchors"
        title="Choose the anchors you want the app to help you protect."
        subtitle="Pick between two and four. Keep it narrow enough that you can actually hold it on rough days."
        footer={
          <>
            <PrimaryButton
              title="Set minimums"
              onPress={() => navigation.navigate('OnboardingAnchorTargets')}
              disabled={!canContinue}
            />
            <Text style={styles.selectionText}>{selectedCount}/4 selected</Text>
          </>
        }
      >
        {ANCHOR_CATALOG.map((anchor) => (
          <OnboardingChoiceCard
            key={anchor.type}
            icon={anchor.icon}
            title={anchor.title}
            description={anchor.description}
            selected={state.selectedAnchors.includes(anchor.type)}
            badge={state.selectedAnchors.includes(anchor.type) ? 'Selected' : null}
            onPress={() => toggleAnchor(anchor.type)}
          />
        ))}
      </OnboardingLayout>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  selectionText: {
    ...theme.typography.bodySm,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});

