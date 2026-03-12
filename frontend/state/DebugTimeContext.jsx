import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  advanceTime,
  getDebugSnapshot,
  getNowDate,
  getNowMs,
  resetTimeDebug,
  setDebugEnabled,
  setTimerSpeed,
  subscribeTimeMachine,
} from '../services/timeMachine';

const DebugTimeContext = createContext(null);

export function DebugTimeProvider({ children }) {
  const [snapshot, setSnapshot] = useState(getDebugSnapshot());

  useEffect(() => {
    const unsubscribe = subscribeTimeMachine(setSnapshot);
    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      ...snapshot,
      nowMs: getNowMs(),
      nowDate: getNowDate(),
      setDebugEnabled,
      setTimerSpeed,
      advanceTime,
      resetTimeDebug,
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
