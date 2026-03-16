import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Card from '../components/Card';
import EditablePickerField from '../components/EditablePickerField';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { useSessionState } from '../state/SessionContext';
import { theme } from '../theme/theme';

const presets = [15, 25, 45, 60, 90];

export default function StartFocusSessionPage({ navigation, route }) {
  const { startFocusSession } = useSessionState();
  const anchorType = route.params?.anchorType || 'deep_work';
  const anchorTitle = route.params?.anchorTitle || 'Deep work';
  const nextAnchorId = route.params?.nextAnchorId || null;
  const nextAnchorLabel = route.params?.nextAnchorLabel || null;
  const defaultDuration = route.params?.defaultDuration || (anchorType === 'upskilling' ? 30 : 60);
  const [duration, setDuration] = useState(defaultDuration);
  const durationOptions = Array.from({ length: 48 }, (_, idx) => (idx + 1) * 5);

  const start = () => {
    const safeDuration = Math.min(240, Math.max(1, Number(duration) || defaultDuration));
    startFocusSession({
      anchorType,
      title: anchorTitle,
      category: anchorType,
      durationMinutes: safeDuration,
      nextAnchorId,
      nextAnchorLabel,
    });
    navigation.navigate('ActiveSession');
  };

  return (
    <ScreenContainer>
      <Card style={styles.card}>
        <Text style={styles.title}>Start {anchorTitle.toLowerCase()} session</Text>
        <Text style={styles.copy}>This block will count toward your {anchorTitle.toLowerCase()} anchor.</Text>
        <Text style={styles.label}>Preset range</Text>
        <Text style={styles.presetCopy}>{presets.join(' • ')} min</Text>
        <EditablePickerField
          label="Duration"
          value={duration}
          onChange={setDuration}
          items={durationOptions}
          getLabel={(item) => `${item} min`}
          isLast
        />
      </Card>

      <PrimaryButton title={`Start ${anchorTitle.toLowerCase()}`} onPress={start} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
  },
  copy: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.textSecondary,
  },
  presetCopy: {
    ...theme.typography.bodySm,
    color: theme.colors.textMuted,
  },
});
