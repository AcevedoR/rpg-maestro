import React from 'react';
import { ToastContainer } from 'react-toastify';
import GithubSourceCodeLink from './ui-components/github-source-code-link/github-source-code-link';
import DiscordInviteLink from './ui-components/discord-invite-link/discord-invite-link';

export function WelcomePage() {
  return (
    <div
      style={{
        height: '100vh',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Welcome to RPG-MAESTRO!</h1>
        <h4>A web app to broadcast music to your players during your TTRPG sessions</h4>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <p>This app is currently in Beta and free to use.</p>
        <p>Public account creation is coming soon, in the mean time, contact me via Discord to have access: <DiscordInviteLink/></p>
        <GithubSourceCodeLink />
      </div>
      <ToastContainer limit={5} />
    </div>
  );
}
