import React from 'react';
import LoginButton from './LoginButton';

export function LoginPage() {
  return (
    <div
      style={{
        height: '100vh',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Login</h1>
        <LoginButton />
      </div>
    </div>
  );
}
