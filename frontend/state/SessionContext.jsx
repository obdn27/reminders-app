import { createContext, useContext, useMemo, useState } from 'react';
import { getNowIso } from '../services/timeMachine';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [activeSession, setActiveSession] = useState(null);
  const [lastSessionResult, setLastSessionResult] = useState(null);

  const startSession = ({ type, anchorType = null, title = null, category, durationMinutes }) => {
    const session = {
      type,
      anchorType,
      title,
      category,
      durationMinutes,
      startTimeIso: getNowIso(),
    };
    setActiveSession(session);
    return session;
  };

  const startFocusSession = ({ anchorType = 'deep_work', title = 'Deep work', category, durationMinutes }) =>
    startSession({ type: 'focus', anchorType, title, category, durationMinutes });

  const startMovementSession = ({ anchorType = 'movement', title = 'Movement', category, durationMinutes }) =>
    startSession({ type: 'movement', anchorType, title, category, durationMinutes });

  const abandonActiveSession = () => {
    setActiveSession(null);
  };

  const completeActiveSession = ({ completedMinutes }) => {
    const result = {
      type: activeSession?.type || 'focus',
      anchorType: activeSession?.anchorType || null,
      title: activeSession?.title || null,
      category: activeSession?.category || 'session',
      plannedMinutes: activeSession?.durationMinutes || completedMinutes,
      completedMinutes,
      completedAtIso: getNowIso(),
    };
    setLastSessionResult(result);
    setActiveSession(null);
    return result;
  };

  const value = useMemo(
    () => ({
      activeSession,
      lastSessionResult,
      startFocusSession,
      startMovementSession,
      abandonActiveSession,
      completeActiveSession,
      setLastSessionResult,
    }),
    [activeSession, lastSessionResult]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionState() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionState must be used inside SessionProvider');
  }
  return context;
}
