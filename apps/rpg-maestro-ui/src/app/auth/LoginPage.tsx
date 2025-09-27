import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginButton from './LoginButton';

export function LoginPage() {
  const rpgmaestroapiurl = import.meta.env.VITE_RPG_MAESTRO_API_URL;

  const navigate = useNavigate();

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
