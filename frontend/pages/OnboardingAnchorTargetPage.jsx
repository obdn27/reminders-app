import { StyleSheet, Text, View } from 'react-native';
import Card from '../components/Card';
import EditablePickerField from '../components/EditablePickerField';
import OnboardingLayout from '../components/OnboardingLayout';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { getAnchorDefinition } from '../data/anchorCatalog';
import { useOnboarding } from '../state/OnboardingContext';
import { theme } from '../theme/theme';

function formatTargetLabel(definition, value) {
  if (definition.targetUnit === 'minutes') {
    return `${value} min`;
  }
  if (definition.targetUnit === 'count') {
    return `${value} / day`;
  }
  return 'Daily completion';
}

export default function OnboardingAnchorTargetPage({ navigation }) {
  const { selectedAnchorDrafts, updateAnchorDraft } = useOnboarding();

  return (
    <ScreenContainer>
      <OnboardingLayout
        step={4}
        totalSteps={7}
        eyebrow="Daily minimums"
        title="Set a version of success you can still hit on stressed days."
        subtitle="These are minimums, not ideal days. The point is to keep the structure alive."
        footer={
          <PrimaryButton title="Set reminder times" onPress={() => navigation.navigate('OnboardingReminderTimes')} />
        }
      >
        {selectedAnchorDrafts.map((anchor, index) => {
          const definition = getAnchorDefinition(anchor.anchorType);
          if (!definition) return null;
          const isCompletionOnly = definition.targetUnit === 'completion';

          return (
            <Card key={anchor.anchorType} style={styles.anchorCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.anchorTitle}>{definition.title}</Text>
                <Text style={styles.anchorDescription}>{definition.description}</Text>
              </View>
              {isCompletionOnly ? (
                <Text style={styles.fixedValue}>Counts as one completion each day.</Text>
              ) : (
                <EditablePickerField
                  label="Daily minimum"
                  value={anchor.targetValue}
                  onChange={(targetValue) => updateAnchorDraft(anchor.anchorType, { targetValue })}
                  items={definition.targetOptions}
                  getLabel={(value) => formatTargetLabel(definition, value)}
                  isLast
                />
              )}
            </Card>
          );
        })}
      </OnboardingLayout>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  anchorCard: {
    gap: theme.spacing.md,
  },
  cardHeader: {
    gap: theme.spacing.xs,
  },
  anchorTitle: {
    ...theme.typography.titleSm,
    color: theme.colors.textPrimary,
  },
  anchorDescription: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  fixedValue: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
  },
});

