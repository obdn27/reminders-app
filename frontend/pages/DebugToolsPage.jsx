import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import Card from '../components/Card';
import EditablePickerField from '../components/EditablePickerField';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import SectionHeader from '../components/SectionHeader';
import { registerForPushToken, requestNotificationPermissions, scheduleDebugLocalNotification } from '../services/notifications';
import { useDebugTime } from '../state/DebugTimeContext';
import { theme } from '../theme/theme';

const speedOptions = [1, 2, 5, 10, 25, 50];

export default function DebugToolsPage() {
  const {
    debugEnabled,
    nowDate,
    offsetMs,
    timerSpeed,
    setDebugEnabled,
    setTimerSpeed,
    advanceTime,
    resetTimeDebug,
  } = useDebugTime();

  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [pushToken, setPushToken] = useState(null);

  const offsetHours = Math.round(offsetMs / (1000 * 60 * 60));

  return (
    <ScreenContainer>
      <Card style={styles.card}>
        <SectionHeader title="Debug Time" subtitle="Skip app time and accelerate timers" />
        <View style={styles.row}>
          <Text style={styles.label}>Debug mode</Text>
          <Switch value={debugEnabled} onValueChange={setDebugEnabled} />
        </View>
        <Text style={styles.copy}>Virtual now: {nowDate.toLocaleString()}</Text>
        <Text style={styles.copy}>Offset: {offsetHours}h</Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.title}>Skip forward</Text>
        <EditablePickerField
          label="Days"
          value={days}
          onChange={setDays}
          items={Array.from({ length: 15 }, (_, idx) => idx)}
          getLabel={(item) => `${item} day${item === 1 ? '' : 's'}`}
        />
        <EditablePickerField
          label="Hours"
          value={hours}
          onChange={setHours}
          items={Array.from({ length: 24 }, (_, idx) => idx)}
          getLabel={(item) => `${item} hour${item === 1 ? '' : 's'}`}
        />
        <EditablePickerField
          label="Minutes"
          value={minutes}
          onChange={setMinutes}
          items={Array.from({ length: 12 }, (_, idx) => idx * 5)}
          getLabel={(item) => `${item} min`}
        />
        <PrimaryButton
          title="Apply time skip"
          onPress={() => {
            advanceTime({ days, hours, minutes });
            setDays(0);
            setHours(0);
            setMinutes(0);
          }}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.title}>Timer speed</Text>
        <View style={styles.speedRow}>
          {speedOptions.map((speed) => {
            const active = timerSpeed === speed;
            return (
              <Pressable
                key={String(speed)}
                style={[styles.speedChip, active ? styles.speedChipActive : null]}
                onPress={() => setTimerSpeed(speed)}
              >
                <Text selectable={false} style={[styles.speedChipText, active ? styles.speedChipTextActive : null]}>
                  {speed}x
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.title}>Notifications (debug)</Text>
        <PrimaryButton
          title="Request notification permission"
          onPress={async () => {
            await requestNotificationPermissions();
          }}
        />
        <PrimaryButton
          variant="secondary"
          title="Register push token"
          onPress={async () => {
            const token = await registerForPushToken();
            setPushToken(token);
          }}
        />
        <PrimaryButton
          variant="secondary"
          title="Send local test notification"
          onPress={async () => {
            await scheduleDebugLocalNotification({
              title: 'Debug reminder',
              body: `Virtual now: ${nowDate.toLocaleString()}`,
              secondsFromNow: 2,
            });
          }}
        />
        <Text style={styles.copy}>Push token: {pushToken || 'Not registered'}</Text>
      </Card>

      <PrimaryButton variant="secondary" title="Reset debug clock" onPress={resetTimeDebug} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  copy: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  speedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  speedChip: {
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  speedChipText: {
    color: theme.colors.textSecondary,
  },
  speedChipActive: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primaryStrong,
  },
  speedChipTextActive: {
    color: theme.colors.primaryDark,
    fontWeight: '700',
  },
});
