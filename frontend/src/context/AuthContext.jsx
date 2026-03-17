import { useEffect, useState } from 'react';
import { fetchCurrentUser, loginRequest, logoutRequest } from '../api/auth';
import { setAuthToken } from '../api/client';
import { AuthContext } from './auth-context';

const TOKEN_KEY = 'restaurant-dashboard-token';
const USER_KEY = 'restaurant-dashboard-user';

function readStoredUser() {
  const rawUser = window.localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => readStoredUser());
  const [isLoading, setIsLoading] = useState(() => Boolean(window.localStorage.getItem(TOKEN_KEY)));

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  useEffect(() => {
    let isCancelled = false;

    async function bootstrapSession() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const nextUser = await fetchCurrentUser();

        if (isCancelled) {
          return;
        }

        window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
        setUser(nextUser);
      } catch {
        if (isCancelled) {
          return;
        }

        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
        setAuthToken(null);
        setToken(null);
        setUser(null);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    bootstrapSession();

    return () => {
      isCancelled = true;
    };
  }, [token]);

  async function login(credentials) {
    const response = await loginRequest({
      ...credentials,
      device_name: 'restaurant-dashboard-web',
    });

    window.localStorage.setItem(TOKEN_KEY, response.token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    setToken(response.token);
    setUser(response.user);

    return response.user;
  }

  async function logout() {
    try {
      if (token) {
        await logoutRequest();
      }
    } catch {
      // Ignore remote logout failures and clear the local session anyway.
    }

    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }

  async function refreshUser() {
    const nextUser = await fetchCurrentUser();
    window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        isAuthenticated: Boolean(token && user),
        isAdmin: user?.role === 'admin',
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
