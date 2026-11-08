import React from 'react';
import BrandPanel from '../../components/auth/BrandPanel.jsx';
import LoginForm from '../../components/auth/LoginForm.jsx';
import AuthLayout from '../../components/layout/AuthLayout.jsx';
import '../../styles/login.css';

export default function LoginPage({ onLogin, onCompleteSignInChallenge }) {
  return <AuthLayout><main className="login-page">
    <div className="medical-decoration decoration-one">✚</div><div className="medical-decoration decoration-two">✧</div><div className="medical-decoration decoration-three">⌁</div>
    <div className="login-card"><BrandPanel/><LoginForm onLogin={onLogin} onCompleteSignInChallenge={onCompleteSignInChallenge}/></div>
    <footer className="login-copyright">© {new Date().getFullYear()} TA Healthcare. All rights reserved.</footer>
  </main></AuthLayout>;
}
