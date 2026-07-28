import { expect, test } from '@playwright/test';
import {
  createTrackViaApi,
  generateNewSession,
  initUsersFixtureSpec,
  RPG_MAESTRO_URL,
  setTrackToPlayViaApi,
  UserWithGeneratedSession,
} from './fixtures';
import { goToMaestroPage, simulateAuthenticatedInBrowser, waitForAppToBeReady } from './navigation';
import { TestUsersFixture } from '@rpg-maestro/test-utils';

/**
 * The Maestro's own audio player, driven in a browser. Everything else exercises it only as a side
 * effect of loading the soundboard, which leaves the part that matters — where the playhead lands, and
 * whether pausing reaches the server — untested.
 */
let userFixture: TestUsersFixture;

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await waitForAppToBeReady(page);
  userFixture = await initUsersFixtureSpec();
  await page.close();
});

test('the Maestro player picks up the playing track, at a sane playhead, and can pause it', async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => pageErrors.push(String(error)));

  let user: UserWithGeneratedSession;
  let trackName: string;

  await test.step('prepare data: a session with a track playing', async () => {
    user = await generateNewSession(userFixture.a_maestro_user);
    const track = await createTrackViaApi(user, user.sessionId, {
      url: `${RPG_MAESTRO_URL}/public/race1.ogg`,
      name: 'maestro-audio-player-test',
    });
    trackName = track.name;
    await setTrackToPlayViaApi(user, user.sessionId, track.id);
  });

  await simulateAuthenticatedInBrowser(page, user);
  await goToMaestroPage(page, user.sessionId);

  await test.step('the player shows the track the session is playing', async () => {
    await expect(page.locator('.maestro-audio-player').getByText(trackName)).toBeVisible();
  });

  await test.step('the playhead sits near the start, not at a clock-skew-sized offset', async () => {
    // The track was set to play seconds ago from position 0, so anything beyond a few seconds means the
    // playhead was computed against the wrong clock.
    await expect
      .poll(() =>
        page.evaluate(
          () => (document.querySelector('.maestro-audio-player audio') as HTMLAudioElement | null)?.currentTime ?? -1
        )
      )
      .toBeGreaterThanOrEqual(0);
    const playheadSeconds = await page.evaluate(
      () => (document.querySelector('.maestro-audio-player audio') as HTMLAudioElement | null)?.currentTime ?? -1
    );
    expect(playheadSeconds).toBeLessThan(30);
  });

  await test.step('pausing from the player is written to the session', async () => {
    await page.getByRole('button', { name: 'Pause' }).click();

    await expect
      .poll(async () => {
        const response = await fetch(`${RPG_MAESTRO_URL}/sessions/${user.sessionId}/playing-tracks`);
        const state = (await response.json()) as { currentTrack: { isPaused: boolean } };
        return state.currentTrack.isPaused;
      })
      .toBe(true);
  });

  await test.step('and it did so without logging an error', () => {
    // A pause landing on a play() that is still starting up rejects with AbortError. That is normal, and
    // used to be reported as "An unexpected error occurred" — this asserts it no longer is.
    // Autoplay being blocked stays excluded: it depends on the browser's policy, not on this code.
    const unexpected = consoleErrors.filter((error) => !/autoplay|NotAllowedError|user interaction/i.test(error));
    expect(pageErrors).toEqual([]);
    expect(unexpected).toEqual([]);
  });
});
