import { createContext, useContext, useMemo, useState } from 'react';
import { getLatestWeeklyReview, getWeeklyReviewHistory } from '../services/api';

const WeeklyReviewContext = createContext(null);

export function WeeklyReviewProvider({ children }) {
  const [latestWeeklyReview, setLatestWeeklyReview] = useState(null);
  const [weeklyReviewHistory, setWeeklyReviewHistory] = useState([]);
  const [loadingWeeklyReview, setLoadingWeeklyReview] = useState(false);

  const refreshLatestWeeklyReview = async () => {
    setLoadingWeeklyReview(true);
    try {
      const result = await getLatestWeeklyReview();
      setLatestWeeklyReview(result.review || null);
      return result.review || null;
    } finally {
      setLoadingWeeklyReview(false);
    }
  };

  const refreshWeeklyReviewHistory = async () => {
    setLoadingWeeklyReview(true);
    try {
      const result = await getWeeklyReviewHistory();
      const reviews = result.reviews || [];
      setWeeklyReviewHistory(reviews);
      return reviews;
    } finally {
      setLoadingWeeklyReview(false);
    }
  };

  const value = useMemo(
    () => ({
      latestWeeklyReview,
      weeklyReviewHistory,
      loadingWeeklyReview,
      refreshLatestWeeklyReview,
      refreshWeeklyReviewHistory,
    }),
    [latestWeeklyReview, weeklyReviewHistory, loadingWeeklyReview]
  );

  return <WeeklyReviewContext.Provider value={value}>{children}</WeeklyReviewContext.Provider>;
}

export function useWeeklyReview() {
  const context = useContext(WeeklyReviewContext);
  if (!context) {
    throw new Error('useWeeklyReview must be used inside WeeklyReviewProvider');
  }
  return context;
}
