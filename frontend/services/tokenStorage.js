import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'auth_refresh_token';

let accessTokenMemory = null;

export function setAccessToken(token) {
  accessTokenMemory = token || null;
}

export function getAccessToken() {
  return accessTokenMemory;
}

export async function setRefreshToken(token) {
  if (!token) {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    return;
  }
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearStoredTokens() {
  accessTokenMemory = null;
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
