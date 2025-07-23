import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { getHealth, RPGMaestroHealthStatus } from './misc-api';

export function HealthStatus() {
  const [health, setHealth] = useState<RPGMaestroHealthStatus | undefined>(undefined);

  const fetchHealth = () => {
    getHealth().then((x) => {
      setHealth(x);
    });
  };

  useEffect(() => {
    let count = 0;
    // eslint-disable-next-line prefer-const
    let intervalId: NodeJS.Timeout;
    const fetchAndCount = () => {
      fetchHealth();
      count++;
      if (count >= 10 && intervalId) {
        clearInterval(intervalId);
      }
    };
    fetchAndCount(); // initial fetch
    intervalId = setInterval(fetchAndCount, 2000);
    return () => clearInterval(intervalId);
  }, []);

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
        <h1 style={{ margin: 0 }}>RPG Maestro health status!</h1>
        {/*  TODO discord link*/}
      </div>
      {health ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          server status: {health.status}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span>Fetching health status... {health}</span>
        </div>
      )}
      <div></div>
      <ToastContainer limit={5} />
    </div>
  );
}
