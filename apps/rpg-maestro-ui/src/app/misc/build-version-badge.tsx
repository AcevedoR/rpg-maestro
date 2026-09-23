import { useEffect, useState } from 'react';
import { getVersionQuietly } from './misc-api';

export function BuildVersionBadge() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    getVersionQuietly().then((v) => setVersion(v?.version ?? null));
  }, []);

  if (!version) {
    return null;
  }
  return (
    <div
      aria-label="build version"
      style={{
        position: 'fixed',
        bottom: '2px',
        right: '6px',
        fontSize: '10px',
        opacity: 0.35,
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 9999,
      }}
    >
      v{version}
    </div>
  );
}
