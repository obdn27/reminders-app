import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  applyRemoteDebugSnapshot,
  getDebugSnapshot,
  getNowDate,
  getNowMs,
  resetTimeDebug,
  setAbsoluteDebugTime,
  setDebugEnabled,
  setTimerSpeed,
  subscribeTimeMachine,
} from '../services/timeMachine';
import { advanceDevTime, getDevTime, resetDevTime, setDevTime } from '../services/api';

const DebugTimeContext = createContext(null);

export function DebugTimeProvider({ children }) {
  const [snapshot, setSnapshot] = useState(getDebugSnapshot());

  useEffect(() => {
    const unsubscribe = subscribeTimeMachine(setSnapshot);
    return unsubscribe;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      try {
        const remoteSnapshot = await getDevTime();
        if (!cancelled) {
          applyRemoteDebugSnapshot(remoteSnapshot);
        }
      } catch (error) {
        // no-op in offline/local failure cases
      }
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const syncSetDebugEnabled = async (enabled) => {
    if (!enabled) {
      await resetDevTime();
      resetTimeDebug();
      return;
    }

    const now = new Date();
    const snapshot = await setDevTime({ isoDatetime: now.toISOString() });
    applyRemoteDebugSnapshot(snapshot);
  };

  const syncAdvanceTime = async ({ days = 0, hours = 0, minutes = 0, seconds = 0 } = {}) => {
    const snapshot = await advanceDevTime({ days, hours, minutes, seconds });
    applyRemoteDebugSnapshot(snapshot);
  };

  const syncResetTimeDebug = async () => {
    const snapshot = await resetDevTime();
    applyRemoteDebugSnapshot(snapshot);
    resetTimeDebug();
  };

  const syncSetAbsoluteDebugTime = async (dateLike) => {
    const isoDatetime = new Date(dateLike).toISOString();
    const snapshot = await setDevTime({ isoDatetime });
    applyRemoteDebugSnapshot(snapshot);
    setAbsoluteDebugTime(isoDatetime);
  };

  const value = useMemo(
    () => ({
      ...snapshot,
      nowMs: getNowMs(),
      nowDate: getNowDate(),
      setDebugEnabled: syncSetDebugEnabled,
      setTimerSpeed,
      advanceTime: syncAdvanceTime,
      resetTimeDebug: syncResetTimeDebug,
      setAbsoluteDebugTime: syncSetAbsoluteDebugTime,
    }),
    [snapshot]
  );

  return <DebugTimeContext.Provider value={value}>{children}</DebugTimeContext.Provider>;
}

export function useDebugTime() {
  const context = useContext(DebugTimeContext);
  if (!context) {
    throw new Error('useDebugTime must be used inside DebugTimeProvider');
  }
  return context;
}
