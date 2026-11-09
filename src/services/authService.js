import {
  signIn as cognitoSignIn,
  signOut as cognitoSignOut,
  fetchAuthSession,
  getCurrentUser,
  confirmSignIn,
  resetPassword,
  confirmResetPassword
} from 'aws-amplify/auth';
import { configureAmplify } from '../config/amplifyConfig.js';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import { defaultStorage, sessionStorage } from 'aws-amplify/utils';
import { apiRequest } from './apiClient.js';

function configureTokenStorage(rememberMe) {
  cognitoUserPoolsTokenProvider.setKeyValueStorage(rememberMe ? defaultStorage : sessionStorage);
}

export async function initializeAuth() {
  configureAmplify();
  configureTokenStorage(localStorage.getItem('ta.remember') === 'true');
  try {
    const session = await fetchAuthSession();
    const accessToken = session.tokens?.accessToken?.toString();
    if (!accessToken) {
      return null;
    }
    
    const user = await getCurrentUser();
    let profile = {};

    try {
      profile = await apiRequest('/api/me');
    } catch (error) {
      console.error('Unable to fetch user profile:', error);
    }
    return {accessToken, user: { ...profile, username: profile.username || user.username } };
  } catch {
    return null;
  }
}

export async function login({ username, password, role }, rememberMe = false) {
  configureAmplify();
  if (!username?.trim() || !password) throw new Error('Enter your email and password to continue.');

  localStorage.setItem('ta.remember', rememberMe ? 'true' : 'false');
  configureTokenStorage(rememberMe);
  const existingSession = await fetchAuthSession();

  if (existingSession.tokens?.accessToken) {
    return finishAuthenticatedSession(role);
  }
  const result = await cognitoSignIn({ username: username.trim(), password });
  if (!result.isSignedIn) {
    const step = result.nextStep?.signInStep;
    if (step === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') return { challenge: 'NEW_PASSWORD_REQUIRED' };
    if (step === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE') return { challenge: 'TOTP_REQUIRED' };
    if (step === 'CONTINUE_SIGN_IN_WITH_TOTP_SETUP') {
      throw new Error('TOTP setup is required for this account. Complete MFA enrollment using the administrator onboarding process.');
    }
    throw new Error(`Additional sign-in step required: ${step || 'contact your administrator'}.`);
  }
  return finishAuthenticatedSession(role);
}

async function finishAuthenticatedSession(role) {
  const session = await fetchAuthSession();
  if (!session.tokens?.accessToken) throw new Error('Cognito did not return an access token.');
  const profile = await apiRequest('/api/me');
  const selectedRole = String(role || '').toUpperCase();
  const assignedGroups = (profile.groups || []).map(group => String(group).toUpperCase());
  if (selectedRole && !assignedGroups.includes(selectedRole)) {
    await cognitoSignOut();
    throw new Error(`This account is not assigned to the ${selectedRole} role. Select your assigned role or contact your administrator.`);
  }
  return { accessToken: session.tokens.accessToken.toString(), user: profile };
}

export async function completeSignInChallenge({ challengeResponse, role }) {
  const result = await confirmSignIn({ challengeResponse });
  if (!result.isSignedIn) {
    throw new Error('The additional sign-in step is not complete. Check the code/password and try again.');
  }
  return finishAuthenticatedSession(role);
}

export async function logout() {
  configureAmplify();
  await cognitoSignOut();
  localStorage.removeItem('ta.remember');
}

export async function requestPasswordReset(username) {
  configureAmplify();
  if (!username?.trim()) throw new Error('Enter your registered email address first.');
  const result = await resetPassword({ username: username.trim() });
  return result.nextStep;
}

export async function confirmPasswordReset({ username, confirmationCode, newPassword }) {
  configureAmplify();
  await confirmResetPassword({
    username: username.trim(),
    confirmationCode: confirmationCode.trim(),
    newPassword
  });
}
