import { createContext, useContext, useMemo, useState } from 'react';
import { getDailyGoals, updateDailyGoals } from '../services/api';

const DailyGoalsContext = createContext(null);

export function DailyGoalsProvider({ children }) {
  const [dailyGoals, setDailyGoals] = useState(null);
  const [loadingDailyGoals, setLoadingDailyGoals] = useState(false);

  const fetchDailyGoals = async () => {
    setLoadingDailyGoals(true);
    try {
      const result = await getDailyGoals();
      setDailyGoals(result);
      return result;
    } finally {
      setLoadingDailyGoals(false);
    }
  };

  const saveDailyGoals = async (payload) => {
    setLoadingDailyGoals(true);
    try {
      const result = await updateDailyGoals(payload);
      setDailyGoals(result);
      return result;
    } finally {
      setLoadingDailyGoals(false);
    }
  };

  const value = useMemo(
    () => ({ dailyGoals, loadingDailyGoals, fetchDailyGoals, saveDailyGoals }),
    [dailyGoals, loadingDailyGoals]
  );

  return <DailyGoalsContext.Provider value={value}>{children}</DailyGoalsContext.Provider>;
}

export function useDailyGoals() {
  const context = useContext(DailyGoalsContext);
  if (!context) {
    throw new Error('useDailyGoals must be used inside DailyGoalsProvider');
  }
  return context;
}
