import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import Card from '../components/Card';
import EditablePickerField from '../components/EditablePickerField';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import SectionHeader from '../components/SectionHeader';
import { registerForPushToken, requestNotificationPermissions, scheduleDebugLocalNotification } from '../services/notifications';
import { useAnchors } from '../state/AnchorsContext';
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
    setAbsoluteDebugTime,
  } = useDebugTime();
  const { fetchAnchors } = useAnchors();

  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [year, setYear] = useState(nowDate.getFullYear());
  const [month, setMonth] = useState(nowDate.getMonth() + 1);
  const [day, setDay] = useState(nowDate.getDate());
  const [setHour, setSetHour] = useState(nowDate.getHours());
  const [setMinute, setSetMinute] = useState(nowDate.getMinutes());
  const [setSecond, setSetSecond] = useState(nowDate.getSeconds());
  const [pushToken, setPushToken] = useState(null);

  const offsetHours = Math.round(offsetMs / (1000 * 60 * 60));

  useEffect(() => {
    setYear(nowDate.getFullYear());
    setMonth(nowDate.getMonth() + 1);
    setDay(nowDate.getDate());
    setSetHour(nowDate.getHours());
    setSetMinute(nowDate.getMinutes());
    setSetSecond(nowDate.getSeconds());
  }, [nowDate]);

  return (
    <ScreenContainer>
      <Card style={styles.card}>
        <SectionHeader title="Debug Time" subtitle="Skip app time and accelerate timers" />
        <View style={styles.row}>
          <Text style={styles.label}>Debug mode</Text>
          <Switch value={debugEnabled} onValueChange={setDebugEnabled} />
        </View>
        <Text style={styles.currentTimeLabel}>Current app time</Text>
        <Text style={styles.currentTimeValue}>
          {nowDate.toLocaleString([], {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </Text>
        <Text style={styles.copy}>Offset: {offsetHours}h</Text>
        <Text style={styles.note}>
          Anchor reminders are scheduled by the device OS on real time, not this fake app clock.
          Use the trigger buttons below for fast notification testing.
        </Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.title}>Set fake datetime</Text>
        <EditablePickerField
          label="Year"
          value={year}
          onChange={setYear}
          items={[2025, 2026, 2027, 2028]}
          getLabel={(item) => String(item)}
        />
        <EditablePickerField
          label="Month"
          value={month}
          onChange={setMonth}
          items={Array.from({ length: 12 }, (_, idx) => idx + 1)}
          getLabel={(item) => String(item).padStart(2, '0')}
        />
        <EditablePickerField
          label="Day"
          value={day}
          onChange={setDay}
          items={Array.from({ length: 31 }, (_, idx) => idx + 1)}
          getLabel={(item) => String(item).padStart(2, '0')}
        />
        <EditablePickerField
          label="Hour"
          value={setHour}
          onChange={setSetHour}
          items={Array.from({ length: 24 }, (_, idx) => idx)}
          getLabel={(item) => `${String(item).padStart(2, '0')}:00`}
        />
        <EditablePickerField
          label="Minute"
          value={setMinute}
          onChange={setSetMinute}
          items={Array.from({ length: 60 }, (_, idx) => idx)}
          getLabel={(item) => `${String(item).padStart(2, '0')} min`}
        />
        <EditablePickerField
          label="Second"
          value={setSecond}
          onChange={setSetSecond}
          items={Array.from({ length: 60 }, (_, idx) => idx)}
          getLabel={(item) => `${String(item).padStart(2, '0')} sec`}
          isLast
        />
        <PrimaryButton
          title="Set fake datetime"
          onPress={() => {
            const next = new Date(year, month - 1, day, setHour, setMinute, setSecond, 0);
            setAbsoluteDebugTime(next);
          }}
        />
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
          items={Array.from({ length: 60 }, (_, idx) => idx)}
          getLabel={(item) => `${item} min`}
        />
        <EditablePickerField
          label="Seconds"
          value={seconds}
          onChange={setSeconds}
          items={Array.from({ length: 60 }, (_, idx) => idx)}
          getLabel={(item) => `${item} sec`}
          isLast
        />
        <PrimaryButton
          title="Apply time skip"
          onPress={() => {
            advanceTime({ days, hours, minutes, seconds });
            setDays(0);
            setHours(0);
            setMinutes(0);
            setSeconds(0);
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
          variant="secondary"
          title="Resync anchor reminders"
          onPress={async () => {
            await fetchAnchors();
          }}
        />
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
  currentTimeLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  currentTimeValue: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
  },
  note: {
    ...theme.typography.bodySm,
    color: theme.colors.textMuted,
    lineHeight: 18,
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
