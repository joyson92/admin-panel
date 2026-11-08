import React, { useState } from 'react';
import { Eye, EyeOff, UserRound, LockKeyhole, Mail, Chrome, Facebook, Apple, LoaderCircle } from 'lucide-react';
import StatusMessage from '../common/StatusMessage.jsx';
import { requestPasswordReset, confirmPasswordReset } from '../../services/authService.js';

export default function LoginForm({ onLogin, onCompleteSignInChallenge }) {
  const role = 'admin';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [mode, setMode] = useState('login');
  const [resetStep, setResetStep] = useState('request');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [signInChallenge, setSignInChallenge] = useState('');
  const [challengeValue, setChallengeValue] = useState('');

  const submit = async event => {
    event.preventDefault(); setError(''); setNotice(''); setBusy(true);
    try {
      const result = await onLogin({ username, password, role }, rememberMe);
      if (result?.challenge) {
        setSignInChallenge(result.challenge);
        setChallengeValue('');
        setNotice(result.challenge === 'NEW_PASSWORD_REQUIRED'
          ? 'Your temporary password must be replaced before you can continue.'
          : 'Enter the verification code from your authenticator app.');
      }
    }
    catch (err) { setError(err.message || 'Unable to sign in. Please try again.'); }
    finally { setBusy(false); }
  };
  const submitSignInChallenge = async event => {
    event.preventDefault(); setError(''); setNotice(''); setBusy(true);
    try {
      await onCompleteSignInChallenge(challengeValue, role);
      setSignInChallenge('');
    } catch (err) { setError(err.message || 'Unable to complete sign-in.'); }
    finally { setBusy(false); }
  };
  const forgotPassword = async () => {
    setError(''); setNotice('');
    if (!username.includes('@')) { setError('Enter your registered email in the username field to reset your password.'); return; }
    try {
      const result = await requestPasswordReset(username);
      if (result?.resetPasswordStep === 'CONFIRM_RESET_PASSWORD_WITH_CODE') {
        setResetStep('confirm');
        setNotice('A password reset code has been sent to your registered email address.');
      } else {
        setNotice('Follow the next step shown by Cognito to complete your password reset.');
      }
    } catch (err) { setError(err.message); }
  };
  const completePasswordReset = async event => {
    event.preventDefault(); setError(''); setNotice(''); setBusy(true);
    try {
      await confirmPasswordReset({ username, confirmationCode, newPassword });
      setMode('login'); setResetStep('request'); setPassword('');
      setConfirmationCode(''); setNewPassword('');
      setNotice('Password updated successfully. Sign in with your new password.');
    } catch (err) { setError(err.message || 'Unable to reset password.'); }
    finally { setBusy(false); }
  };
  const socialNotice = provider => { setNotice(`${provider} sign-in can be enabled by connecting its OAuth provider in your backend.`); setError(''); };

  return <section className="login-form-panel"><div className="login-form-inner">
    <header className="login-heading"><h2>{mode === 'signup' ? 'Create account' : 'Sign in'}</h2>
      <p>{mode === 'signup' ? 'Registration is managed by your hospital administrator' : 'Enter your credentials to log in'}</p></header>
    {signInChallenge ? (
      <form onSubmit={submitSignInChallenge} className="login-form">
        <p className="reset-intro">{signInChallenge === 'NEW_PASSWORD_REQUIRED'
          ? 'Set a new password for your TA account. Use at least 12 characters, including upper/lowercase letters, a number and a symbol.'
          : 'Enter the six-digit code from your authenticator app.'}</p>
        <label className="login-field"><span>{signInChallenge === 'NEW_PASSWORD_REQUIRED' ? 'New password*' : 'Authenticator code*'}</span>
          <input type={signInChallenge === 'NEW_PASSWORD_REQUIRED' ? 'password' : 'text'} autoComplete={signInChallenge === 'NEW_PASSWORD_REQUIRED' ? 'new-password' : 'one-time-code'}
            value={challengeValue} onChange={e => setChallengeValue(e.target.value)}
            placeholder={signInChallenge === 'NEW_PASSWORD_REQUIRED' ? 'Create a new password' : 'Enter verification code'} required
            minLength={signInChallenge === 'NEW_PASSWORD_REQUIRED' ? 12 : 6} /></label>
        <StatusMessage type="error">{error}</StatusMessage><StatusMessage type="success">{notice}</StatusMessage>
        <button className="login-submit" type="submit" disabled={busy}>{busy ? 'Please wait...' : 'Continue'}</button>
        <button type="button" className="text-action reset-back" onClick={() => { setSignInChallenge(''); setChallengeValue(''); setPassword(''); setError(''); setNotice(''); }}>Back to sign in</button>
      </form>
    ) : mode === 'reset' ? (
      <form onSubmit={resetStep === 'request' ? (event => { event.preventDefault(); forgotPassword(); }) : completePasswordReset} className="login-form">
        <p className="reset-intro">Reset your password using the email address registered with your TA account.</p>
        <label className="login-field"><span>Email*</span><UserRound size={19}/><input type="email" autoComplete="email" value={username} onChange={e => setUsername(e.target.value)} placeholder="name@hospital.com" required /></label>
        {resetStep === 'confirm' && <>
          <label className="login-field"><span>Confirmation code*</span><input value={confirmationCode} onChange={e => setConfirmationCode(e.target.value)} placeholder="Enter email code" required /></label>
          <label className="login-field"><span>New password*</span><input type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" required minLength={12}/></label>
        </>}
        <StatusMessage type="error">{error}</StatusMessage><StatusMessage type="success">{notice}</StatusMessage>
        <button className="login-submit" type="submit" disabled={busy}>{busy ? 'Please wait...' : resetStep === 'request' ? 'Send reset code' : 'Update password'}</button>
        <button type="button" className="text-action reset-back" onClick={() => { setMode('login'); setResetStep('request'); setError(''); setNotice(''); }}>Back to sign in</button>
      </form>
    ) : <>
    <div className="admin-access-label"><span className="admin-access-dot"/> Administrator access</div>
    <form onSubmit={submit} className="login-form">
      <label className="login-field"><span>Email*</span><UserRound size={19}/>
        <input autoComplete="email" value={username} onChange={e => setUsername(e.target.value)} placeholder="name@hospital.com" required /></label>
      <label className="login-field"><span>Password*</span><LockKeyhole size={19}/>
        <input autoComplete="current-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required />
        <button className="password-toggle" type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <Eye size={21}/> : <EyeOff size={21}/>}</button></label>
      <div className="login-options"><label className="remember-option"><input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}/><span>Remember me</span></label>
        <button type="button" className="text-action" onClick={() => { setMode('reset'); setResetStep('request'); setError(''); setNotice(''); }}>Forgot Password?</button></div>
      <StatusMessage type="error">{error}</StatusMessage>
      <StatusMessage type="success">{notice}</StatusMessage>
      <button className="login-submit" type="submit" disabled={busy}>{busy ? <><LoaderCircle className="login-spinner" size={19}/> Signing in...</> : 'Login'}</button>
    </form>
    {mode === 'login' && <div className="signup-prompt">Don't have an account? <span className="text-action">Contact your hospital administrator</span></div>}
    {mode === 'login' && <div className="social-login" aria-label="Other sign-in providers">
      <button type="button" onClick={() => socialNotice('Google')} aria-label="Continue with Google"><Chrome size={25}/></button>
      <button type="button" onClick={() => socialNotice('Facebook')} aria-label="Continue with Facebook"><Facebook size={23} fill="currentColor"/></button>
      <button type="button" onClick={() => socialNotice('Apple')} aria-label="Continue with Apple"><Apple size={25} fill="currentColor"/></button>
    </div>}
    </>}
    <p className="login-security-note"><Mail size={14}/> Secure access for your healthcare team</p>
  </div></section>;
}
