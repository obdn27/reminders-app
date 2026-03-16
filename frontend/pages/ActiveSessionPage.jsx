import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import PrimaryButton from '../components/PrimaryButton';
import { createSession } from '../services/api';
import { endSessionLiveActivity, startSessionLiveActivity, updateSessionLiveActivity } from '../services/liveActivities';
import { syncAnchorReminderNotifications } from '../services/notifications';
import { useAnchors } from '../state/AnchorsContext';
import { useAnchorProgress } from '../state/AnchorProgressContext';
import { useDebugTime } from '../state/DebugTimeContext';
import { useReminders } from '../state/ReminderContext';
import { getNowIso, getNowMs, getTimerSpeed } from '../services/timeMachine';
import { useSessionState } from '../state/SessionContext';
import { useTodayProgress } from '../state/TodayProgressContext';
import { theme } from '../theme/theme';
import { getNextUpSuggestion } from '../utils/anchors';
import { goBackOrNavigateHome } from '../utils/navigation';

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  return `${mm}:${ss}`;
}

function TimerRing({ progress = 0, children }) {
  const size = 264;
  const strokeWidth = 16;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const dashOffset = circumference * (1 - clamped);

  return (
    <View style={styles.ringWrap}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={theme.colors.borderSoft}
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.45}
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={theme.colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>
      <View style={styles.ringContent}>{children}</View>
    </View>
  );
}

export default function ActiveSessionPage({ navigation }) {
  const { activeSession, abandonActiveSession, completeActiveSession, setLastSessionResult } =
    useSessionState();
  const { anchors } = useAnchors();
  const { todayAnchors, applyAnchorProgress, refreshTodayAnchors } = useAnchorProgress();
  const { applySessionResult, refreshTodayProgress, ruleState } = useTodayProgress();
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
    syncAnchorReminderNotifications({
      anchors,
      todayAnchors: todayAnchors?.anchors || [],
      activeSession,
      retentionState: ruleState?.retentionState,
    }).catch(() => {});
    startSessionLiveActivity({
      category: activeSession.category,
      type: activeSession.type,
      durationMinutes: activeSession.durationMinutes,
    });
    return () => {
      endSessionLiveActivity();
    };
  }, [activeSession, anchors, todayAnchors?.anchors, ruleState?.retentionState]);

  if (!activeSession) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.emptyState}>
          <Text style={styles.title}>No active session</Text>
          <Text style={styles.copy}>Start a new session from Home.</Text>
          <PrimaryButton
            title="Back home"
            onPress={() => goBackOrNavigateHome(navigation)}
            style={styles.actionButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const sessionLabel =
    activeSession.title
      ? `${activeSession.title} Session`
      : activeSession.type === 'movement'
        ? 'Movement Session'
        : 'Focus Session';
  const progress = initialSeconds > 0 ? (initialSeconds - secondsLeft) / initialSeconds : 0;

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
        anchorType: activeSession.anchorType,
        category: activeSession.category,
        plannedMinutes: activeSession.durationMinutes,
        completedMinutes,
        completedAt: getNowIso(),
      };
      const result = await createSession(payload);
      applySessionResult(result);
      applyAnchorProgress(result.anchorProgress);
      await refreshTodayProgress();
      const refreshedAnchors = await refreshTodayAnchors();
      await refreshLatestReminder();
      const nextSuggestion = getNextUpSuggestion(refreshedAnchors?.anchors || result?.anchorProgress?.anchors || []);
      await syncAnchorReminderNotifications({
        anchors,
        todayAnchors: refreshedAnchors?.anchors || result?.anchorProgress?.anchors || [],
        activeSession: null,
        retentionState: result?.ruleState?.retentionState || ruleState?.retentionState,
      });
      setLastSessionResult({
        ...draft,
        type: result?.session?.type || draft.type,
        anchorType: result?.session?.anchorType || draft.anchorType,
        title: result?.session?.label || draft.title,
        category: result?.session?.category || draft.category,
        plannedMinutes: result?.session?.plannedMinutes || draft.plannedMinutes,
        completedMinutes: result?.session?.completedMinutes || draft.completedMinutes,
        nextAnchorId: nextSuggestion?.anchorId || null,
        nextAnchorLabel: nextSuggestion?.label || null,
      });
    } catch (error) {
      // keep optimistic local result
    }

    navigation.replace('SessionComplete');
  };

  const onAbandon = () => {
    abandonActiveSession();
    goBackOrNavigateHome(navigation);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.sessionMeta}>
          <Text style={styles.title}>{sessionLabel}</Text>
          <Text style={styles.category}>{String(activeSession.title || activeSession.category || '').toUpperCase()}</Text>
        </View>

        <View style={styles.centerStage}>
          <TimerRing progress={progress}>
            <Text style={styles.timer}>{formatTime(secondsLeft)}</Text>
          </TimerRing>
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            title={secondsLeft === 0 ? 'Complete session' : 'Finish early'}
            onPress={onComplete}
            style={styles.footerActionButton}
          />
          <PrimaryButton
            variant="secondary"
            title="Abandon"
            onPress={onAbandon}
            style={styles.footerActionButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  emptyState: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  sessionMeta: {
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
  },
  centerStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringWrap: {
    width: 264,
    height: 264,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringContent: {
    position: 'absolute',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },
  footerActionButton: {
    flex: 1,
    minHeight: 54,
  },
  title: {
    ...theme.typography.hero,
    color: theme.colors.textPrimary,
  },
  category: {
    ...theme.typography.caption,
    letterSpacing: 1,
    color: theme.colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timer: {
    fontSize: 54,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
});
