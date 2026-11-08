import React from 'react';

export default function StatusMessage({ type = 'info', children }) {
  if (!children) return null;
  return <p className={`login-feedback ${type}`} role={type === 'error' ? 'alert' : 'status'}>{children}</p>;
}
