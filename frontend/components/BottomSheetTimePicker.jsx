import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  REMINDER_HOUR_OPTIONS,
  REMINDER_MINUTE_OPTIONS,
  REMINDER_SECOND_OPTIONS,
  buildReminderTime,
  padTimePart,
  parseReminderTimeParts,
} from '../data/reminderTimes';
import { theme } from '../theme/theme';

function WheelColumn({ label, value, onChange, items }) {
  return (
    <View style={styles.wheelColumn}>
      <Text style={styles.columnLabel}>{label}</Text>
      <Picker
        selectedValue={value}
        onValueChange={onChange}
        style={styles.picker}
        itemStyle={styles.itemStyle}
      >
        {items.map((item) => (
          <Picker.Item key={String(item)} label={padTimePart(item)} value={item} />
        ))}
      </Picker>
    </View>
  );
}

export default function BottomSheetTimePicker({ visible, title, value, onChange, onClose }) {
  const translateY = useRef(new Animated.Value(420)).current;
  const [draftTime, setDraftTime] = useState(parseReminderTimeParts(value));

  useEffect(() => {
    if (visible) {
      setDraftTime(parseReminderTimeParts(value));
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    } else {
      translateY.setValue(420);
    }
  }, [visible, value, translateY]);

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <Pressable onPress={() => {}} style={styles.content}>
            <View style={styles.header}>
              <Pressable style={styles.headerAction} onPress={onClose}>
                <MaterialCommunityIcons name="close" size={20} color={theme.colors.textSecondary} />
              </Pressable>
              <Text style={styles.title}>{title}</Text>
              <Pressable
                style={[styles.headerAction, styles.headerActionPrimary]}
                onPress={() => {
                  onChange(buildReminderTime(draftTime));
                  onClose();
                }}
              >
                <MaterialCommunityIcons name="check" size={20} color={theme.colors.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.wheelFrame}>
              <View style={styles.columnsRow}>
                <WheelColumn
                  label="Hour"
                  value={draftTime.hour}
                  onChange={(hour) => setDraftTime((current) => ({ ...current, hour }))}
                  items={REMINDER_HOUR_OPTIONS}
                />
                <WheelColumn
                  label="Minute"
                  value={draftTime.minute}
                  onChange={(minute) => setDraftTime((current) => ({ ...current, minute }))}
                  items={REMINDER_MINUTE_OPTIONS}
                />
                <WheelColumn
                  label="Second"
                  value={draftTime.second}
                  onChange={(second) => setDraftTime((current) => ({ ...current, second }))}
                  items={REMINDER_SECOND_OPTIONS}
                />
              </View>
              <LinearGradient
                pointerEvents="none"
                colors={[theme.colors.surface, 'rgba(22, 27, 34, 0)']}
                style={styles.topFade}
              />
              <LinearGradient
                pointerEvents="none"
                colors={['rgba(22, 27, 34, 0)', theme.colors.surface]}
                style={styles.bottomFade}
              />
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.overlay,
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  content: {
    gap: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.xs,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
  },
  headerActionPrimary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  wheelFrame: {
    position: 'relative',
    height: 224,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  columnsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  wheelColumn: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  columnLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  picker: {
    width: '100%',
    height: 196,
  },
  itemStyle: {
    fontSize: 20,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  topFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 16,
    height: 44,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 44,
  },
});
