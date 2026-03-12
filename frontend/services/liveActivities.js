import { Platform } from 'react-native';
import { startActivity, stopActivity, updateActivity } from 'expo-live-activity';
import { getNowMs } from './timeMachine';

let activeLiveActivityId = null;

export function isLiveActivitySupported() {
  return Platform.OS === 'ios';
}

function toLiveActivityState({ type, category, secondsRemaining = 0 }) {
  const mins = Math.max(0, Math.ceil(secondsRemaining / 60));
  return {
    title: type === 'movement' ? 'Movement Session' : 'Focus Session',
    subtitle: `${category} • ${mins}m left`,
    progressBar: {
      progress: undefined,
      date: Math.floor(getNowMs() / 1000) + secondsRemaining,
    },
  };
}

export async function startSessionLiveActivity({ type, category, durationMinutes }) {
  if (!isLiveActivitySupported()) {
    return { started: false, reason: 'iOS only' };
  }

  try {
    const activityId = startActivity(
      toLiveActivityState({
        type,
        category,
        secondsRemaining: Math.max(0, durationMinutes * 60),
      })
    );
    activeLiveActivityId = activityId || null;
    return { started: Boolean(activityId), id: activityId || null };
  } catch (error) {
    return { started: false, reason: 'Live Activity unavailable in Expo Go. Use a dev build.' };
  }
}

export async function updateSessionLiveActivity({ type, category, secondsRemaining }) {
  if (!activeLiveActivityId) {
    return { updated: false, reason: 'No active activity' };
  }

  try {
    updateActivity(activeLiveActivityId, toLiveActivityState({ type, category, secondsRemaining }));
    return { updated: true };
  } catch (error) {
    return { updated: false, reason: 'Update failed' };
  }
}

export async function endSessionLiveActivity() {
  if (!activeLiveActivityId) {
    return { ended: false, reason: 'No active activity' };
  }

  try {
    stopActivity(activeLiveActivityId, {
      title: 'Session complete',
      subtitle: 'Great work',
    });
    activeLiveActivityId = null;
    return { ended: true };
  } catch (error) {
    activeLiveActivityId = null;
    return { ended: false, reason: 'Stop failed' };
  }
}
