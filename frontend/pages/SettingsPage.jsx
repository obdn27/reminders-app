import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Card from '../components/Card';
import EditablePickerField from '../components/EditablePickerField';
import ScreenContainer from '../components/ScreenContainer';
import SettingsSection from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import TimePickerField from '../components/TimePickerField';
import ToneSelector from '../components/ToneSelector';
import { getAnchorDefinition } from '../data/anchorCatalog';
import { formatReminderTime } from '../data/reminderTimes';
import { TIMEZONES } from '../data/timezones';
import { useAnchors } from '../state/AnchorsContext';
import { useProfile } from '../state/ProfileContext';
import { theme } from '../theme/theme';

const toneOptions = ['direct', 'neutral', 'supportive'];

function formatTarget(anchor) {
  if (anchor.targetUnit === 'minutes') return `${anchor.targetValue} min`;
  if (anchor.targetUnit === 'count') return `${anchor.targetValue} / day`;
  return 'Daily completion';
}

export default function SettingsPage({ navigation }) {
  const { profile, updateProfile } = useProfile();
  const { anchors, saveAnchors, fetchAnchors } = useAnchors();
  const [tonePreference, setTonePreference] = useState(profile?.tonePreference || 'direct');
  const [timezone, setTimezone] = useState(
    profile?.timezone && TIMEZONES.includes(profile.timezone) ? profile.timezone : 'UTC'
  );

  const orderedAnchors = useMemo(
    () => [...anchors].sort((left, right) => (left.displayOrder || 0) - (right.displayOrder || 0)),
    [anchors]
  );

  useEffect(() => {
    if (!anchors.length) {
      fetchAnchors().catch(() => {});
    }
  }, [anchors.length, fetchAnchors]);

  const persistAnchors = async (nextAnchors) => {
    await saveAnchors({
      anchors: nextAnchors.map((anchor) => ({
        anchorType: anchor.anchorType,
        targetValue: anchor.targetValue,
        reminderTime: anchor.reminderTime,
        active: anchor.active !== false,
      })),
    });
  };

  const updateAnchor = async (anchorId, patch) => {
    const nextAnchors = orderedAnchors.map((anchor) =>
      anchor.id === anchorId ? { ...anchor, ...patch } : anchor
    );
    await persistAnchors(nextAnchors);
  };

  const handleTonePreference = async (nextValue) => {
    setTonePreference(nextValue);
    await updateProfile({ tonePreference: nextValue, sprintModeEnabled: true });
  };

  const handleTimezone = async (nextValue) => {
    setTimezone(nextValue);
    await updateProfile({ timezone: nextValue, sprintModeEnabled: true });
  };

  return (
    <ScreenContainer>
      <View style={styles.sectionWrap}>
        <Text style={styles.sectionTitle}>Routine</Text>
        <View style={styles.anchorCards}>
          {orderedAnchors.map((anchor) => {
            const definition = getAnchorDefinition(anchor.anchorType);
            if (!definition) return null;
            const isCompletion = anchor.targetUnit === 'completion';

            return (
              <Card key={anchor.id} style={styles.anchorCard}>
                <View style={styles.anchorHeader}>
                  <Text style={styles.anchorTitle}>{definition.title}</Text>
                  <Text style={styles.anchorSummary}>{formatTarget(anchor)}</Text>
                </View>
                {isCompletion ? (
                  <SettingsRow
                    label="Daily target"
                    value="Daily completion"
                    helper="This anchor is marked complete once per day."
                  />
                ) : (
                  <EditablePickerField
                    label="Daily target"
                    value={anchor.targetValue}
                    onChange={(targetValue) => updateAnchor(anchor.id, { targetValue })}
                    items={definition.targetOptions}
                    getLabel={(value) =>
                      definition.targetUnit === 'minutes' ? `${value} min` : `${value} / day`
                    }
                  />
                )}
                <TimePickerField
                  label="Reminder time"
                  value={anchor.reminderTime}
                  onChange={(reminderTime) => updateAnchor(anchor.id, { reminderTime })}
                  isLast
                />
              </Card>
            );
          })}
        </View>
      </View>

      <SettingsSection title="Behavior">
        <SettingsRow
          label="Tone preference"
          helper="Choose how direct the app should feel."
          isLast
        />
        <ToneSelector options={toneOptions} value={tonePreference} onChange={handleTonePreference} />
      </SettingsSection>

      <SettingsSection title="System">
        <EditablePickerField
          label="Timezone"
          value={timezone}
          onChange={handleTimezone}
          items={TIMEZONES}
          getLabel={(item) => item}
          isLast
        />
      </SettingsSection>

      <SettingsSection title="More">
        <SettingsRow
          label="Account"
          value={profile?.email || 'Unknown user'}
          onPress={() => navigation.navigate('Account')}
          showChevron
        />
        <SettingsRow
          label="How this app works"
          icon="information-outline"
          onPress={() => navigation.navigate('HowItWorks')}
          showChevron
        />
        <SettingsRow
          label="Debug tools"
          icon="flask-outline"
          onPress={() => navigation.navigate('DebugTools')}
          showChevron
          isLast
        />
      </SettingsSection>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionWrap: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  anchorCards: {
    gap: theme.spacing.md,
  },
  anchorCard: {
    gap: theme.spacing.sm,
  },
  anchorHeader: {
    gap: theme.spacing.xs,
  },
  anchorTitle: {
    ...theme.typography.titleSm,
    color: theme.colors.textPrimary,
  },
  anchorSummary: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
  },
});
