import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearStoredTokens,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '../services/tokenStorage';
import { getMe, login as apiLogin, logout as apiLogout, refreshToken as apiRefresh, setAuthFailureHandler, signup as apiSignup } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessTokenState] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const logout = async () => {
    await apiLogout();
    await clearStoredTokens();
    setAccessTokenState(null);
    setAccessToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    setAuthFailureHandler(async () => {
      await logout();
    });
  }, []);

  const refreshSession = async () => {
    const existingRefreshToken = await getRefreshToken();
    if (!existingRefreshToken) {
      throw new Error('No refresh token');
    }

    const refreshed = await apiRefresh({ refreshToken: existingRefreshToken });
    setAccessToken(refreshed.accessToken);
    setAccessTokenState(refreshed.accessToken);

    if (refreshed.refreshToken) {
      await setRefreshToken(refreshed.refreshToken);
    }

    const me = await getMe();
    setUser(me);
    setIsAuthenticated(true);

    return { user: me, accessToken: refreshed.accessToken };
  };

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const existingRefreshToken = await getRefreshToken();
        if (!existingRefreshToken) {
          return;
        }

        await refreshSession();
      } catch (error) {
        await clearStoredTokens();
        if (mounted) {
          setUser(null);
          setAccessTokenState(null);
          setAccessToken(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setIsBootstrapping(false);
        }
      }
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async ({ email, password }) => {
    const result = await apiLogin({ email, password });

    await setRefreshToken(result.refreshToken);
    setAccessToken(result.accessToken);

    setAccessTokenState(result.accessToken);
    setUser(result.user);
    setIsAuthenticated(true);

    return result;
  };

  const signup = async ({ email, password, name }) => {
    const result = await apiSignup({ email, password, name });

    await setRefreshToken(result.refreshToken);
    setAccessToken(result.accessToken);

    setAccessTokenState(result.accessToken);
    setUser(result.user);
    setIsAuthenticated(true);

    return result;
  };

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated,
      isBootstrapping,
      login,
      signup,
      logout,
      refreshSession,
      setUser,
    }),
    [user, accessToken, isAuthenticated, isBootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
