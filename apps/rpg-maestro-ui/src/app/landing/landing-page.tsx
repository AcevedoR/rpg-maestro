import React, { useEffect, useRef, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { CreateLandingVisitRequest } from '@rpg-maestro/rpg-maestro-api-contract';
import DiscordInviteLink from '../ui-components/discord-invite-link/discord-invite-link';
import GithubSourceCodeLink from '../ui-components/github-source-code-link/github-source-code-link';
import { EmailCaptureForm } from './email-capture-form';
import { getLandingReferrer, getLandingSource, sendLandingVisitBeacon } from './landing-api';
import './landing-page.css';

export function LandingPage() {
  const [signedUp, setSignedUp] = useState(false);
  const visitBeaconSent = useRef(false);

  useEffect(() => {
    if (visitBeaconSent.current) {
      return;
    }
    visitBeaconSent.current = true;
    sendLandingVisitBeacon(new CreateLandingVisitRequest(getLandingSource(), getLandingReferrer()));
  }, []);

  return (
    <div className="landing">
      <header className="landing-hero">
        <h1>Your players hear your music too. One link, no setup.</h1>
        <p className="landing-tagline">
          <strong>RPG Maestro</strong> is a soundboard for game masters that broadcasts to every player at the table —
          or across the internet — perfectly in sync. No Discord audio duct tape. No screen-sharing a browser tab. No
          losing a play night to setup.
        </p>
        <EmailCaptureForm signedUp={signedUp} onSignedUp={() => setSignedUp(true)} />
        <p className="landing-price-line">
          Free during early access · <strong>$4/month at launch</strong> · founding members keep $3/month forever
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
        <p>Bring your own library (upload your files, tag them, build collections) — or use ours.</p>
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
        <h2>Early access</h2>
        <p>
          We're opening the table to the first <strong>50 GMs</strong>:
        </p>
        <ul className="landing-early-access-list">
          <li>
            <strong>Free while in beta</strong> — help shape it
          </li>
          <li>
            <strong>$4/month at launch</strong> — less than one d20 set 🎲
          </li>
          <li>
            Founding members: <strong>$3/month, forever</strong>
          </li>
        </ul>
        <EmailCaptureForm signedUp={signedUp} onSignedUp={() => setSignedUp(true)} />
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
          <p>Yes — your files, your tags, your collections.</p>
          <h3>Do I need my players to make accounts?</h3>
          <p>No. One link.</p>
          <h3>What about my existing Syrinscape/Tabletop Audio stuff?</h3>
          <p>Keep using what you own — upload anything you're licensed to use.</p>
        </div>
      </section>

      <footer className="landing-footer">
        <GithubSourceCodeLink />
      </footer>
      <ToastContainer limit={5} />
    </div>
  );
}
