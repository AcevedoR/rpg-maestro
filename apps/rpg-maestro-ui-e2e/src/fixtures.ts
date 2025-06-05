import { test } from '@playwright/test';

export async function iniTracksFromFileServerFixture(sessionId: string): Promise<void> {
  await test.step('init tracks from fileserver using api', async () => {
    try {
      const res = await fetch(`http://localhost:8099/maestro/sessions/${sessionId}/tracks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'http://localhost:8099/public/race1.ogg',
        }),
      });
      if (!res.ok) {
        console.error(res);
        test.fail();
      }
    } catch (err) {
      console.error(err);
      test.fail();
    }
  });
}
