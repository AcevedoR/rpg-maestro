import React from 'react';
import { ToastContainer } from 'react-toastify';

export function SetupSession() {
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
        <h1 style={{ margin: 0 }}>Account created!</h1>
        <h4>Onboarding almost finished</h4>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <p>TODO a soon as landing on the page, create a session backend side for this Maestro</p>
        <p>if the Maestro already have a session, dont do that API call but display a message</p>
        <p>then display the Copy URL</p>
        <p>and a button to go to the session</p>
      </div>
      <div></div>
      <ToastContainer limit={5} />
    </div>
  );
}
