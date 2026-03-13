import { createContext, useContext, useMemo, useState } from 'react';
import { getAnchors, updateAnchors } from '../services/api';
import { syncAnchorReminderNotifications } from '../services/notifications';

const AnchorsContext = createContext(null);

export function AnchorsProvider({ children }) {
  const [anchors, setAnchors] = useState([]);
  const [loadingAnchors, setLoadingAnchors] = useState(false);

  const fetchAnchors = async () => {
    setLoadingAnchors(true);
    try {
      const result = await getAnchors();
      setAnchors(result.anchors || []);
      await syncAnchorReminderNotifications(result.anchors || []);
      return result;
    } finally {
      setLoadingAnchors(false);
    }
  };

  const saveAnchors = async (payload) => {
    setLoadingAnchors(true);
    try {
      const result = await updateAnchors(payload);
      setAnchors(result.anchors || []);
      await syncAnchorReminderNotifications(result.anchors || []);
      return result;
    } finally {
      setLoadingAnchors(false);
    }
  };

  const value = useMemo(
    () => ({ anchors, loadingAnchors, fetchAnchors, saveAnchors }),
    [anchors, loadingAnchors]
  );

  return <AnchorsContext.Provider value={value}>{children}</AnchorsContext.Provider>;
}

export function useAnchors() {
  const context = useContext(AnchorsContext);
  if (!context) {
    throw new Error('useAnchors must be used inside AnchorsProvider');
  }
  return context;
}
