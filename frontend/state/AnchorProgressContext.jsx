import { createContext, useContext, useMemo, useState } from 'react';
import { getTodayAnchorProgress, updateTodayAnchorProgress } from '../services/api';

const AnchorProgressContext = createContext(null);

export function AnchorProgressProvider({ children }) {
  const [todayAnchors, setTodayAnchors] = useState(null);
  const [loadingAnchorProgress, setLoadingAnchorProgress] = useState(false);

  const refreshTodayAnchors = async () => {
    setLoadingAnchorProgress(true);
    try {
      const result = await getTodayAnchorProgress();
      setTodayAnchors(result);
      return result;
    } finally {
      setLoadingAnchorProgress(false);
    }
  };

  const saveAnchorProgress = async (payload) => {
    setLoadingAnchorProgress(true);
    try {
      const result = await updateTodayAnchorProgress(payload);
      setTodayAnchors(result);
      return result;
    } finally {
      setLoadingAnchorProgress(false);
    }
  };

  const applyAnchorProgress = (payload) => {
    if (!payload) return;
    if (payload.anchorProgress) {
      setTodayAnchors(payload.anchorProgress);
    } else if (payload.anchors) {
      setTodayAnchors(payload);
    }
  };

  const value = useMemo(
    () => ({
      todayAnchors,
      loadingAnchorProgress,
      refreshTodayAnchors,
      saveAnchorProgress,
      applyAnchorProgress,
    }),
    [todayAnchors, loadingAnchorProgress]
  );

  return <AnchorProgressContext.Provider value={value}>{children}</AnchorProgressContext.Provider>;
}

export function useAnchorProgress() {
  const context = useContext(AnchorProgressContext);
  if (!context) {
    throw new Error('useAnchorProgress must be used inside AnchorProgressProvider');
  }
  return context;
}
