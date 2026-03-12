import { createContext, useContext, useMemo, useState } from 'react';
import {
  completeDailyJobTask,
  getTodayProgress,
  patchTodayProgress,
  recommitDiscipline,
} from '../services/api';

const TodayProgressContext = createContext(null);

export function TodayProgressProvider({ children }) {
  const [todayProgress, setTodayProgress] = useState(null);
  const [ruleState, setRuleState] = useState(null);
  const [loadingTodayProgress, setLoadingTodayProgress] = useState(false);

  const refreshTodayProgress = async () => {
    setLoadingTodayProgress(true);
    try {
      const result = await getTodayProgress();
      setTodayProgress(result.dailyProgress);
      setRuleState(result.ruleState);
      return result;
    } finally {
      setLoadingTodayProgress(false);
    }
  };

  const updateTodayProgress = async (payload) => {
    setLoadingTodayProgress(true);
    try {
      const result = await patchTodayProgress(payload);
      setTodayProgress(result.dailyProgress);
      setRuleState(result.ruleState);
      return result;
    } finally {
      setLoadingTodayProgress(false);
    }
  };

  const markDailyJobTaskComplete = async () => {
    setLoadingTodayProgress(true);
    try {
      const result = await completeDailyJobTask();
      setTodayProgress(result.dailyProgress);
      setRuleState(result.ruleState);
      return result;
    } finally {
      setLoadingTodayProgress(false);
    }
  };

  const applySessionResult = (payload) => {
    if (!payload) return;
    if (payload.dailyProgress) {
      setTodayProgress(payload.dailyProgress);
    }
    if (payload.ruleState) {
      setRuleState(payload.ruleState);
    }
  };

  const recommit = async () => {
    setLoadingTodayProgress(true);
    try {
      const result = await recommitDiscipline();
      setTodayProgress(result.dailyProgress || null);
      setRuleState(result.ruleState || null);
      return result;
    } finally {
      setLoadingTodayProgress(false);
    }
  };

  const value = useMemo(
    () => ({
      todayProgress,
      ruleState,
      loadingTodayProgress,
      refreshTodayProgress,
      updateTodayProgress,
      markDailyJobTaskComplete,
      applySessionResult,
      recommit,
    }),
    [todayProgress, ruleState, loadingTodayProgress]
  );

  return <TodayProgressContext.Provider value={value}>{children}</TodayProgressContext.Provider>;
}

export function useTodayProgress() {
  const context = useContext(TodayProgressContext);
  if (!context) {
    throw new Error('useTodayProgress must be used inside TodayProgressProvider');
  }
  return context;
}
