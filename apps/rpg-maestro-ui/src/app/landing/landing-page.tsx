import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateLandingVisitRequest } from '@rpg-maestro/rpg-maestro-api-contract';
import DiscordInviteLink from '../ui-components/discord-invite-link/discord-invite-link';
import GithubSourceCodeLink from '../ui-components/github-source-code-link/github-source-code-link';
import { UpgradeInterestModal } from './upgrade-interest-modal';
import { getLandingReferrer, getLandingSource, persistLandingSource } from './landing-attribution';
import { sendLandingEventBeacon, sendLandingVisitBeacon } from './landing-api';
import './landing-page.css';

export function LandingPage() {
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const visitBeaconSent = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (visitBeaconSent.current) {
      return;
    }
    visitBeaconSent.current = true;
    persistLandingSource();
    sendLandingVisitBeacon(new CreateLandingVisitRequest(getLandingSource(), getLandingReferrer()));
  }, []);

  const onStartFree = (): void => {
    persistLandingSource();
    sendLandingEventBeacon('start_free_clicked');
    navigate('/onboarding');
  };

  return (
    <div className="landing">
      <header className="landing-hero">
        <h1>Your players hear your music too. One link, no setup.</h1>
        <p className="landing-tagline">
          <strong>RPG Maestro</strong> is a soundboard for game masters that broadcasts to every player at the table —
          or across the internet — perfectly in sync. No Discord audio duct tape. No screen-sharing a browser tab. No
          losing a play night to setup.
        </p>
        <button className="landing-cta-button landing-hero-cta" onClick={onStartFree}>
          Start free →
        </button>
        <p className="landing-price-line">
          Free tier, no card · <strong>Maestro $4/month</strong> · founding members keep $3/month forever
        </p>
      </header>

      <section>
        <h2>The problem (you've lived this)</h2>
        <ul className="landing-problem-list">
          <li>Your Spotify playlist hits shuffle-jank — or an ad — right at the boss reveal.</li>
          <li>
            Other soundboards sound great <em>on your machine</em>. Your remote players hear nothing, so you pipe audio
            through Kenku FM into Discord… until an update breaks the chain.
          </li>
          <li>
            As one GM put it after trying to wire this up for his group:{' '}
            <em>"that's just too many changes for 5 people and me, without losing a play night to setup."</em>
          </li>
        </ul>
        <p>
          Sharing audio across browsers is genuinely hard — other tools' devs say so themselves.{' '}
          <strong>It's the one thing we built first.</strong> It's been running at a real table every week for over a
          year.
        </p>
      </section>

      <section>
        <h2>How it works</h2>
        <ol className="landing-how-it-works">
          <li>
            <strong>You</strong> open your board and pick a scene — <em>tavern</em>, <em>ambush</em>,{' '}
            <em>the dragon wakes</em>.
          </li>
          <li>
            <strong>Your players</strong> open one link. Phone, tablet, laptop, or the TV at the table. That's it.
          </li>
          <li>
            <strong>Everyone hears the same thing at the same moment.</strong> Switch scenes in one tap; the music
            crossfades for the whole party — in the room or three time zones away.
          </li>
        </ol>
        <p>
          Bring your own library (upload your files, tag them, build collections) — or use ours. Both work on the free
          tier: <strong>test the sync with the music you already play.</strong>
        </p>
      </section>

      <section>
        <h2>
          Music made <em>for</em> this, by a GM who is also a musician
        </h2>
        <p>
          No stock-loop soup. Original ambience and combat tracks, composed and produced by a working musician who GMs
          weekly — tagged by scene and mood, ready mid-session. New tracks land every month.{' '}
          <em>(Every track is licensed for personal table use.)</em>
        </p>
      </section>

      <section className="landing-panel">
        <h2>Pricing</h2>
        <div className="landing-table-scroll">
          <table className="landing-pricing-table">
            <thead>
              <tr>
                <th></th>
                <th>Free</th>
                <th>Maestro — $4/month</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Synced broadcast to every player</td>
                <td>✅</td>
                <td>✅</td>
              </tr>
              <tr>
                <td>One link, no player accounts</td>
                <td>✅</td>
                <td>✅</td>
              </tr>
              <tr>
                <td>Your own uploads</td>
                <td>up to 30 tracks</td>
                <td>up to 10 GB (~1,200 tracks)</td>
              </tr>
              <tr>
                <td>Our original collections</td>
                <td>2 starter collections</td>
                <td>
                  <strong>the whole library</strong>
                </td>
              </tr>
              <tr>
                <td>New tracks composed every month</td>
                <td>—</td>
                <td>✅ included</td>
              </tr>
              <tr>
                <td>In-person + remote tables</td>
                <td>✅</td>
                <td>✅</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="landing-pricing-actions">
          <button className="landing-cta-button" onClick={onStartFree}>
            Start free →
          </button>
          <button className="landing-secondary-button" onClick={() => setUpgradeModalOpen(true)}>
            Maestro $4/mo
          </button>
        </div>
        <p className="landing-no-card-note">— no card, runs your next session.</p>
        <p>
          <strong>Founding members:</strong> the first <strong>50 GMs</strong> who upgrade keep{' '}
          <strong>$3/month, forever</strong>, even as the library grows.{' '}
          <em>(Not a discount code — it's locked to your account.)</em>
        </p>
        <p className="landing-discord-alternative">or jump into the Discord and say hi</p>
        <DiscordInviteLink />
      </section>

      <section>
        <h2>FAQ</h2>
        <div className="landing-faq">
          <h3>Does it work with Discord/Zoom games?</h3>
          <p>Yes — that's the point. Players just open a browser link; no bots, no virtual audio cables, nothing to install.</p>
          <h3>In-person tables?</h3>
          <p>Yes. Point the link at the TV or a tablet; your phone is the remote.</p>
          <h3>Can I upload my own music?</h3>
          <p>
            Yes, on the free tier too (up to 30 tracks) — your files, your tags, your collections. Maestro raises it to
            10 GB, about 1,200 tracks.
          </p>
          <h3>What happens to my uploads?</h3>
          <p>
            They're re-encoded for smooth streaming to your players, kept private to your sessions, and never shared or
            made public. Free-tier libraries may be cleared after long inactivity — we'll email you first.
          </p>
          <h3>What do I actually pay for?</h3>
          <p>
            The music. Sync, sharing and your own uploads stay free; Maestro buys the original collections I compose and
            the new ones landing every month.
          </p>
          <h3>Do I need my players to make accounts?</h3>
          <p>No. One link.</p>
          <h3>What about my existing Syrinscape/Tabletop Audio stuff?</h3>
          <p>Keep using what you own — upload anything you're licensed to use.</p>
        </div>
      </section>

      <footer className="landing-footer">
        <GithubSourceCodeLink />
      </footer>
      <UpgradeInterestModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
    </div>
  );
}
