import React from 'react';
import LoginPage from '../pages/auth/LoginPage.jsx';
import DashboardPage from '../pages/dashboard/DashboardPage.jsx';
import useAuth from '../hooks/useAuth.js';

export default function AppRoutes() {
  const { session, isAuthenticated, signIn, completeSignInChallenge, signOut, initializing } = useAuth();
  if (initializing) return <main className="app-loading">Loading TA securely...</main>;
  return isAuthenticated
    ? <DashboardPage user={session?.user} onLogout={signOut} />
    : <LoginPage onLogin={signIn} onCompleteSignInChallenge={completeSignInChallenge} />;
}
