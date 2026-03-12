import { createContext, useContext, useMemo, useState } from 'react';
import { getLatestReminder, getPendingReminders, markReminderOpened } from '../services/api';

const ReminderContext = createContext(null);

export function ReminderProvider({ children }) {
  const [latestReminder, setLatestReminder] = useState(null);
  const [pendingReminders, setPendingReminders] = useState([]);
  const [loadingReminders, setLoadingReminders] = useState(false);

  const refreshLatestReminder = async () => {
    setLoadingReminders(true);
    try {
      const result = await getLatestReminder();
      setLatestReminder(result.reminder || null);
      return result.reminder || null;
    } finally {
      setLoadingReminders(false);
    }
  };

  const refreshPendingReminders = async () => {
    setLoadingReminders(true);
    try {
      const result = await getPendingReminders();
      const reminders = result.reminders || [];
      setPendingReminders(reminders);
      return reminders;
    } finally {
      setLoadingReminders(false);
    }
  };

  const openReminder = async (reminderId) => {
    const result = await markReminderOpened(reminderId);
    if (result?.reminder?.id === latestReminder?.id) {
      setLatestReminder(result.reminder);
    }
    setPendingReminders((prev) => prev.filter((item) => item.id !== reminderId));
    return result?.reminder;
  };

  const value = useMemo(
    () => ({
      latestReminder,
      pendingReminders,
      loadingReminders,
      refreshLatestReminder,
      refreshPendingReminders,
      openReminder,
    }),
    [latestReminder, pendingReminders, loadingReminders]
  );

  return <ReminderContext.Provider value={value}>{children}</ReminderContext.Provider>;
}

export function useReminders() {
  const context = useContext(ReminderContext);
  if (!context) {
    throw new Error('useReminders must be used inside ReminderProvider');
  }
  return context;
}
