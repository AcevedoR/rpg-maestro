import * as React from 'react';

export default function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '4px',
        border: '1px solid var(--gold-color, #b8960c)',
        fontFamily: 'monospace',
        fontSize: '0.85em',
        background: 'rgba(255,255,255,0.05)',
        color: 'var(--gold-color, #b8960c)',
      }}
    >
      {children}
    </kbd>
  );
}
