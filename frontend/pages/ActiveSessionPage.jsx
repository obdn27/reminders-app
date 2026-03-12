import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { createSession } from '../services/api';
import { endSessionLiveActivity, startSessionLiveActivity, updateSessionLiveActivity } from '../services/liveActivities';
import { useDebugTime } from '../state/DebugTimeContext';
import { useReminders } from '../state/ReminderContext';
import { getNowIso, getNowMs, getTimerSpeed } from '../services/timeMachine';
import { useSessionState } from '../state/SessionContext';
import { useTodayProgress } from '../state/TodayProgressContext';
import { theme } from '../theme/theme';
import { goBackOrNavigateHome } from '../utils/navigation';

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function ActiveSessionPage({ navigation }) {
  const { activeSession, abandonActiveSession, completeActiveSession, setLastSessionResult } =
    useSessionState();
  const { applySessionResult, refreshTodayProgress } = useTodayProgress();
  const { refreshLatestReminder } = useReminders();
  const { timerSpeed } = useDebugTime();

  const initialSeconds = useMemo(
    () => (activeSession ? activeSession.durationMinutes * 60 : 0),
    [activeSession]
  );

  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (!activeSession || secondsLeft <= 0) return undefined;
    const interval = setInterval(() => {
      const plannedSeconds = (activeSession.durationMinutes || 0) * 60;
      const startedAtMs = new Date(activeSession.startTimeIso).getTime();
      const elapsedSeconds = Math.floor(((getNowMs() - startedAtMs) / 1000) * getTimerSpeed());
      setSecondsLeft(Math.max(0, plannedSeconds - elapsedSeconds));
      updateSessionLiveActivity({
        category: activeSession.category,
        type: activeSession.type,
        secondsRemaining: Math.max(0, plannedSeconds - elapsedSeconds),
      });
    }, 250);
    return () => clearInterval(interval);
  }, [activeSession, secondsLeft, timerSpeed]);

  useEffect(() => {
    if (!activeSession) return undefined;
    startSessionLiveActivity({
      category: activeSession.category,
      type: activeSession.type,
      durationMinutes: activeSession.durationMinutes,
    });
    return () => {
      endSessionLiveActivity();
    };
  }, [activeSession]);

  if (!activeSession) {
    return (
      <ScreenContainer>
        <Card>
          <Text style={styles.title}>No active session</Text>
          <Text style={styles.copy}>Start a new session from Home.</Text>
        </Card>
        <PrimaryButton title="Back home" onPress={() => goBackOrNavigateHome(navigation)} />
      </ScreenContainer>
    );
  }

  const sessionLabel = activeSession.type === 'movement' ? 'Movement Session' : 'Focus Session';

  const onComplete = async () => {
    const plannedSeconds = initialSeconds;
    const startedAtMs = new Date(activeSession.startTimeIso).getTime();
    const elapsedByClock = Math.max(0, Math.floor(((getNowMs() - startedAtMs) / 1000) * getTimerSpeed()));
    const elapsedByCountdown = Math.max(0, plannedSeconds - secondsLeft);
    const completedSeconds = Math.min(plannedSeconds, Math.max(elapsedByClock, elapsedByCountdown));
    const completedMinutes = Math.max(1, Math.round(completedSeconds / 60));

    const draft = completeActiveSession({ completedMinutes });

    try {
      const payload = {
        type: activeSession.type,
        category: activeSession.category,
        plannedMinutes: activeSession.durationMinutes,
        completedMinutes,
        completedAt: getNowIso(),
      };
      const result = await createSession(payload);
      applySessionResult(result);
      await refreshTodayProgress();
      await refreshLatestReminder();
      setLastSessionResult({
        ...draft,
        type: result?.session?.type || draft.type,
        category: result?.session?.category || draft.category,
        plannedMinutes: result?.session?.plannedMinutes || draft.plannedMinutes,
        completedMinutes: result?.session?.completedMinutes || draft.completedMinutes,
      });
    } catch (error) {
      // keep optimistic local result
    }

    goBackOrNavigateHome(navigation);
  };

  const onAbandon = () => {
    abandonActiveSession();
    goBackOrNavigateHome(navigation);
  };

  return (
    <ScreenContainer>
      <Card style={styles.card}>
        <Text style={styles.title}>{sessionLabel}</Text>
        <Text style={styles.category}>{activeSession.category.toUpperCase()}</Text>
        <Text style={styles.timer}>{formatTime(secondsLeft)}</Text>
        <Text style={styles.copy}>Stay present. One block at a time.</Text>
      </Card>

      <PrimaryButton
        title={secondsLeft === 0 ? 'Complete session' : 'Finish early'}
        onPress={onComplete}
      />
      <PrimaryButton variant="secondary" title="Abandon" onPress={onAbandon} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  category: {
    fontSize: 13,
    letterSpacing: 1,
    color: theme.colors.textMuted,
    fontWeight: '700',
  },
  timer: {
    fontSize: 56,
    fontWeight: '800',
    color: theme.colors.primaryStrong,
  },
  copy: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
});
