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
const DEV_TIME_KEY = process.env.EXPO_PUBLIC_DEV_TIME_KEY || '';

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
  const debugDate = getAsOfDateParam();
  if (debugDate) {
    config.headers['X-Debug-Date'] = debugDate;
    if (DEV_TIME_KEY) {
      config.headers['X-Dev-Time-Key'] = DEV_TIME_KEY;
    }
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

// Anchors
export async function getAnchors() {
  const response = await apiClient.get('/anchors');
  return response.data;
}

export async function updateAnchors(payload) {
  const response = await apiClient.put('/anchors', payload);
  return response.data;
}

// Anchor progress
export async function getTodayAnchorProgress() {
  const response = await apiClient.get('/anchor-progress/today');
  return response.data;
}

export async function updateTodayAnchorProgress(payload) {
  const response = await apiClient.patch('/anchor-progress/today', payload);
  return response.data;
}

export async function getAnchorProgressHistory(limit = 7) {
  const response = await apiClient.get('/anchor-progress/history', {
    params: { limit },
  });
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
  const response = await apiClient.get('/daily-progress/today');
  return response.data;
}

export async function patchTodayProgress(payload) {
  const response = await apiClient.patch('/daily-progress/today', payload);
  return response.data;
}

export async function completeDailyJobTask() {
  const response = await apiClient.post('/daily-progress/complete-job-task');
  return response.data;
}

export async function getDailyProgressHistory(limit = 30) {
  const response = await apiClient.get('/daily-progress/history', {
    params: { limit },
  });
  return response.data;
}

export async function resetDiscipline() {
  const response = await apiClient.post('/discipline/reset');
  return response.data;
}

// Sessions
export async function createSession(payload) {
  const response = await apiClient.post('/sessions', payload);
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

// Dev time
export async function getDevTime() {
  const response = await apiClient.get('/dev/time');
  return response.data;
}

export async function setDevTime(payload) {
  const response = await apiClient.post('/dev/time/set', payload);
  return response.data;
}

export async function advanceDevTime(payload) {
  const response = await apiClient.post('/dev/time/advance', payload);
  return response.data;
}

export async function resetDevTime() {
  const response = await apiClient.post('/dev/time/reset');
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

export const recommitDiscipline = resetDiscipline;
