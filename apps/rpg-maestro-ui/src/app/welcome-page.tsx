import React from 'react';
import { ToastContainer } from 'react-toastify';

export function WelcomePage() {
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0' }}>
        <h1 style={{ margin: 0 }}>Welcome to RPG-MAESTRO</h1>
        <h4>welcome page todo</h4>
      </div>
      <ToastContainer limit={5} />
    </div>
  );
}
