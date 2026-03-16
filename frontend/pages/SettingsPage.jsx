import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '../components/Card';
import EditablePickerField from '../components/EditablePickerField';
import LabeledInput from '../components/LabeledInput';
import ScreenContainer from '../components/ScreenContainer';
import SettingsSection from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import TimePickerField from '../components/TimePickerField';
import ToneSelector from '../components/ToneSelector';
import { getAnchorDefinition } from '../data/anchorCatalog';
import { TIMEZONES } from '../data/timezones';
import { useAnchors } from '../state/AnchorsContext';
import { useProfile } from '../state/ProfileContext';
import { theme } from '../theme/theme';

const toneOptions = ['direct', 'neutral', 'supportive'];

export default function SettingsPage({ navigation }) {
  const { profile, updateProfile } = useProfile();
  const { anchors, saveAnchors, fetchAnchors } = useAnchors();
  const [tonePreference, setTonePreference] = useState(profile?.tonePreference || 'direct');
  const [timezone, setTimezone] = useState(
    profile?.timezone && TIMEZONES.includes(profile.timezone) ? profile.timezone : 'UTC'
  );
  const [draftAnchors, setDraftAnchors] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  const [editingAnchorId, setEditingAnchorId] = useState(null);

  const orderedAnchors = useMemo(
    () => [...anchors].sort((left, right) => (left.displayOrder || 0) - (right.displayOrder || 0)),
    [anchors]
  );

  useEffect(() => {
    if (!isDirty) {
      setDraftAnchors(orderedAnchors);
    }
  }, [orderedAnchors, isDirty]);

  useEffect(() => {
    if (!anchors.length) {
      fetchAnchors().catch(() => {});
    }
  }, [anchors.length, fetchAnchors]);

  const persistAnchors = async (nextAnchors) => {
    await saveAnchors({
      anchors: nextAnchors.map((anchor, index) => {
        const nextAnchor = nextAnchors[index + 1] || null;
        return {
          id: anchor.id,
          category: anchor.category || anchor.anchorType,
          label: anchor.label,
          targetValue: anchor.targetValue,
          reminderTime: anchor.reminderTime,
          nextAnchorId: nextAnchor?.id || null,
          active: anchor.active !== false,
        };
      }),
    });
  };

  const getReminderSortValue = (reminderTime) => {
    if (!reminderTime) return Number.MAX_SAFE_INTEGER;
    const [hour = '99', minute = '99'] = String(reminderTime).split(':');
    return Number(hour) * 60 + Number(minute);
  };

  const normalizeAnchors = (items) =>
    [...items].sort((left, right) => {
      const byReminder = getReminderSortValue(left.reminderTime) - getReminderSortValue(right.reminderTime);
      if (byReminder !== 0) return byReminder;
      return (left.displayOrder || 0) - (right.displayOrder || 0);
    });

  useEffect(() => {
    if (!isDirty) {
      return undefined;
    }

    const timeoutId = setTimeout(async () => {
      const normalized = normalizeAnchors(
        draftAnchors.map((anchor) => {
          const definition = getAnchorDefinition(anchor.anchorType);
          return {
            ...anchor,
            label: String(anchor.label || '').trim() || definition?.title || anchor.label,
          };
        })
      );
      setDraftAnchors(normalized);
      await persistAnchors(normalized);
      setIsDirty(false);
    }, 1200);

    return () => clearTimeout(timeoutId);
  }, [draftAnchors, isDirty]);

  const updateDraftAnchor = (anchorId, patch) => {
    setDraftAnchors((current) =>
      current.map((anchor) =>
        anchor.id === anchorId ? { ...anchor, ...patch } : anchor
      )
    );
    setIsDirty(true);
  };

  const resetAnchorLabel = (anchorId) => {
    const anchor = draftAnchors.find((item) => item.id === anchorId);
    const definition = anchor ? getAnchorDefinition(anchor.anchorType) : null;
    if (!anchor || !definition || anchor.label === definition.title) {
      return;
    }
    updateDraftAnchor(anchorId, { label: definition.title });
  };

  const startEditingAnchor = (anchorId) => {
    setEditingAnchorId(anchorId);
  };

  const finishEditingAnchor = (anchorId, fallbackLabel) => (event) => {
    const nextLabel = event?.nativeEvent?.text?.trim() || fallbackLabel;
    updateDraftAnchor(anchorId, { label: nextLabel });
    setEditingAnchorId(null);
  };

  const handleTonePreference = async (nextValue) => {
    setTonePreference(nextValue);
    await updateProfile({ tonePreference: nextValue, sprintModeEnabled: true });
  };

  const handleTimezone = async (nextValue) => {
    setTimezone(nextValue);
    await updateProfile({ timezone: nextValue, sprintModeEnabled: true });
  };

  const hasAnchors = draftAnchors.length > 0;

  return (
    <ScreenContainer>
      <View style={styles.sectionWrap}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Routine</Text>
          {hasAnchors ? <Text style={styles.sectionHelper}>Auto-sorts by reminder time after edits settle.</Text> : null}
        </View>
        <View style={styles.anchorCards}>
          {draftAnchors.map((anchor) => {
            const definition = getAnchorDefinition(anchor.anchorType);
            if (!definition) return null;
            const isCompletion = anchor.targetUnit === 'completion';
            const hasCustomLabel = anchor.label !== definition.title;

            return (
              <Card key={anchor.id} style={styles.anchorCard}>
                <View style={styles.anchorHeaderRow}>
                  <View style={styles.anchorTitleWrap}>
                    <Text style={styles.anchorTitle}>{anchor.label}</Text>
                    <Pressable
                      onPress={() => startEditingAnchor(anchor.id)}
                      style={({ pressed }) => [styles.editButton, pressed ? styles.editButtonPressed : null]}
                    >
                      <MaterialCommunityIcons name="pencil-outline" size={16} color={theme.colors.textSecondary} />
                    </Pressable>
                  </View>
                  <View style={styles.anchorActions}>
                    {hasCustomLabel ? (
                      <Pressable
                        onPress={() => resetAnchorLabel(anchor.id)}
                        style={({ pressed }) => [
                          styles.resetButton,
                          pressed ? styles.resetButtonPressed : null,
                        ]}
                      >
                        <Text style={styles.resetButtonText}>Reset</Text>
                      </Pressable>
                    ) : (
                      <Text style={styles.anchorTypeTag}>{definition.title}</Text>
                    )}
                  </View>
                </View>
                {editingAnchorId === anchor.id ? (
                  <LabeledInput
                    value={anchor.label}
                    onChangeText={(label) => updateDraftAnchor(anchor.id, { label })}
                    onEndEditing={finishEditingAnchor(anchor.id, definition.title)}
                    onSubmitEditing={finishEditingAnchor(anchor.id, definition.title)}
                    placeholder="Rename anchor"
                    maxLength={120}
                    hideLabel
                    autoFocus
                    returnKeyType="done"
                  />
                ) : null}
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
                    onChange={(targetValue) => updateDraftAnchor(anchor.id, { targetValue })}
                    items={definition.targetOptions}
                    getLabel={(value) =>
                      definition.targetUnit === 'minutes' ? `${value} min` : `${value} / day`
                    }
                  />
                )}
                <TimePickerField
                  label="Reminder time"
                  value={anchor.reminderTime}
                  onChange={(reminderTime) => updateDraftAnchor(anchor.id, { reminderTime })}
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
  sectionHeader: {
    gap: theme.spacing.xs,
  },
  sectionTitle: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionHelper: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
  },
  anchorCards: {
    gap: theme.spacing.md,
  },
  anchorCard: {
    gap: theme.spacing.sm,
  },
  anchorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  anchorTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  anchorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  anchorTitle: {
    ...theme.typography.titleSm,
    color: theme.colors.textPrimary,
    flexShrink: 1,
  },
  editButton: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonPressed: {
    opacity: 0.8,
  },
  resetButton: {
    minHeight: 34,
    paddingHorizontal: theme.spacing.sm + 2,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
  },
  resetButtonPressed: {
    opacity: 0.82,
  },
  resetButtonText: {
    ...theme.typography.bodySm,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  anchorTypeTag: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
});
