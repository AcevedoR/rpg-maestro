import React from 'react';

type DiscordInviteProps = {
  buttonText?: string;
};

const DiscordInviteLink: React.FC<DiscordInviteProps> = ({
                                                       buttonText = 'Join our Discord',
                                                     }) => {
  return (
    <div style={{ textAlign: 'center', margin: '1em 0' }}>
      <a
        href={'https://discord.gg/e4cvXZc3bZ'}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          backgroundColor: '#5865F2',
          color: '#fff',
          padding: '0.75em 1.5em',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: '1rem',
        }}
      >
        {buttonText}
      </a>
    </div>
  );
};

export default DiscordInviteLink;