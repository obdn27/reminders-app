import axios from 'axios';
import { getAsOfDateParam } from './timeMachine';
import {
  clearStoredTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from './tokenStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

if (__DEV__) {
  console.log('[api] baseURL:', API_BASE_URL);
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

let authFailureHandler = null;

export function setAuthFailureHandler(handler) {
  authFailureHandler = handler;
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const statusCode = error.response?.status;

    if (statusCode !== 401 || originalRequest._retry) {
      throw error;
    }

    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/signup') ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/logout');

    if (isAuthEndpoint) {
      throw error;
    }

    originalRequest._retry = true;

    try {
      const storedRefreshToken = await getRefreshToken();
      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken: storedRefreshToken,
      });

      const { accessToken, refreshToken: nextRefreshToken } = refreshResponse.data;
      setAccessToken(accessToken);
      if (nextRefreshToken) {
        await setRefreshToken(nextRefreshToken);
      }

      originalRequest.headers = {
        ...(originalRequest.headers || {}),
        Authorization: `Bearer ${accessToken}`,
      };

      return apiClient(originalRequest);
    } catch (refreshError) {
      await clearStoredTokens();
      if (authFailureHandler) {
        await authFailureHandler();
      }
      throw refreshError;
    }
  }
);

// Auth
export async function signup(payload) {
  const response = await apiClient.post('/auth/signup', payload);
  return response.data;
}

export async function login(payload) {
  const response = await apiClient.post('/auth/login', payload);
  return response.data;
}

export async function refreshToken(payload) {
  const response = await apiClient.post('/auth/refresh', payload);
  return response.data;
}

export async function getMe() {
  const response = await apiClient.get('/auth/me');
  return response.data;
}

export async function logout() {
  try {
    await apiClient.post('/auth/logout');
  } catch (error) {
    // no-op for MVP
  }
}

// Profile
export async function getMyProfile() {
  const response = await apiClient.get('/users/me/profile');
  return response.data;
}

export async function updateMyProfile(payload) {
  const response = await apiClient.patch('/users/me', payload);
  return response.data;
}

// Daily goals
export async function getDailyGoals() {
  const response = await apiClient.get('/daily-goals');
  return response.data;
}

export async function updateDailyGoals(payload) {
  const response = await apiClient.put('/daily-goals', payload);
  return response.data;
}

// Daily progress
export async function getTodayProgress() {
  const asOfDate = getAsOfDateParam();
  const response = await apiClient.get('/daily-progress/today', {
    params: asOfDate ? { asOfDate } : undefined,
  });
  return response.data;
}

export async function patchTodayProgress(payload) {
  const asOfDate = getAsOfDateParam();
  const response = await apiClient.patch('/daily-progress/today', payload, {
    params: asOfDate ? { asOfDate } : undefined,
  });
  return response.data;
}

export async function completeDailyJobTask() {
  const asOfDate = getAsOfDateParam();
  const response = await apiClient.post('/daily-progress/complete-job-task', null, {
    params: asOfDate ? { asOfDate } : undefined,
  });
  return response.data;
}

export async function getDailyProgressHistory(limit = 30) {
  const asOfDate = getAsOfDateParam();
  const response = await apiClient.get('/daily-progress/history', {
    params: asOfDate ? { limit, asOfDate } : { limit },
  });
  return response.data;
}

export async function recommitDiscipline() {
  const asOfDate = getAsOfDateParam();
  const response = await apiClient.post('/discipline/recommit', null, {
    params: asOfDate ? { asOfDate } : undefined,
  });
  return response.data;
}

// Sessions
export async function createSession(payload) {
  const asOfDate = getAsOfDateParam();
  const response = await apiClient.post('/sessions', payload, {
    params: asOfDate ? { asOfDate } : undefined,
  });
  return response.data;
}

// Reminders
export async function getLatestReminder() {
  const response = await apiClient.get('/reminders/latest');
  return response.data;
}

export async function getPendingReminders() {
  const response = await apiClient.get('/reminders/pending');
  return response.data;
}

export async function markReminderOpened(reminderId) {
  const response = await apiClient.patch(`/reminders/${reminderId}/opened`);
  return response.data;
}

// Weekly review
export async function getLatestWeeklyReview() {
  const response = await apiClient.get('/weekly-review/latest');
  return response.data;
}

export async function getWeeklyReviewHistory() {
  const response = await apiClient.get('/weekly-review/history');
  return response.data;
}

export async function generateWeeklyReview() {
  const response = await apiClient.post('/weekly-review/generate');
  return response.data;
}

export {
  apiClient,
  API_BASE_URL,
  setAccessToken,
  setRefreshToken,
  clearStoredTokens,
  getRefreshToken,
};
