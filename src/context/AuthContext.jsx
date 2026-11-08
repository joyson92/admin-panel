import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let active = true;
    authService.initializeAuth()
      .then(result => { if (active) setSession(result); })
      .finally(() => { if (active) setInitializing(false); });
    return () => { active = false; };
  }, []);

  const signIn = useCallback(async (credentials, rememberMe) => {
    const result = await authService.login(credentials, rememberMe);
    if (result.challenge) return result;
    setSession({ accessToken: result.accessToken, user: result.user });
    return result;
  }, []);

  const completeSignInChallenge = useCallback(async (challengeResponse, role) => {
    const result = await authService.completeSignInChallenge({ challengeResponse, role });
    setSession({ accessToken: result.accessToken, user: result.user });
    return result;
  }, []);

  const signOut = useCallback(async () => {
    await authService.logout();
    setSession(null);
  }, []);

  const value = useMemo(() => ({
    session, signIn, completeSignInChallenge, signOut, initializing,
    isAuthenticated: Boolean(session?.accessToken)
  }), [session, signIn, completeSignInChallenge, signOut, initializing]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
