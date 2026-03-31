import AudioPlayer from 'react-h5-audio-player';
import H5AudioPlayer from 'react-h5-audio-player';
import { ToastContainer } from 'react-toastify';
import React, { LegacyRef, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { resyncIfNeeded } from '../track-sync/track-sync';
import { displayError } from '../error-utils';
import { PlayingTrack } from '@rpg-maestro/rpg-maestro-api-contract';
import GithubSourceCodeLink from '../ui-components/github-source-code-link/github-source-code-link';
import './audio-player-readonly.css';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { TextLinkWithIconWrapper } from '../ui-components/text-link-with-icon-wrapper';
import SpatialAudioOffIcon from '@mui/icons-material/SpatialAudioOff';
import { useParams } from 'react-router';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  //background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom));
`;

const Header = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

const Title = styled.h1`
  text-align: center;
  color: var(--text-primary);
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(to bottom, #daa520 0%, #f4e4bc 30%, #8b4513 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 4px 20px rgba(218, 165, 32, 0.2);
`;

const MaestroLink = styled.div`
  width: 30%;
  min-width: 170px;
  display: flex;
  justify-content: flex-end;
`;

const WelcomeText = styled.div`
  text-align: center;
  max-width: 800px;
  margin: 2rem auto;
  color: var(--text-secondary);
  line-height: 1.6;
  
  p {
    margin: 1rem 0;
    font-size: 1.1rem;
  }
`;

const StyledAudioPlayer = styled(AudioPlayer)`
    min-width: 300px;
    min-height: 300px;
    max-width: 600px;
    width: 40vw;
    height: 30vh;
    padding: 1.5rem;
    overflow-wrap: break-word;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.22);
    transition: all 0.3s ease;
    background: rgba(26, 11, 46, 0.6);
    border: 1px solid rgba(218, 165, 32, 0.3);
    border-radius: 24px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
`;

export const SYNC_TRACK_INTERVAL_MS = 1000;

export function PlayersUi() {
  const [currentTrack, setCurrentTrack] = useState<PlayingTrack | null>(null);
  const [shortEffectTrack, setShortEffectTrack] = useState<PlayingTrack | null>(null);
  const audioPlayer = useRef<H5AudioPlayer>();
  const effectAudioRef = useRef<HTMLAudioElement>(null);
  const sessionId = useParams().sessionId ?? '';
  if (sessionId === '') {
    displayError('no session found in URL (it should be https://{URL}/session/{sessionId})');
  }

  useEffect(() => {
    async function resyncOnUi() {
      const syncResult = await resyncIfNeeded(
        sessionId,
        audioPlayer.current?.audio?.current?.currentTime ?? null,
        currentTrack,
        shortEffectTrack,
      );
      if (syncResult === 'AbortedRequestError') {
        return;
      }

      // Handle current track sync
      const newerServerTrack = syncResult.currentTrack;
      if (newerServerTrack) {
        console.info('synchronizing track');
        setCurrentTrack(newerServerTrack);
        if (audioPlayer.current?.audio?.current) {
          if (audioPlayer.current.audio.current.src !== newerServerTrack.url) {
            audioPlayer.current.audio.current.src = newerServerTrack.url;
          }
          audioPlayer.current.audio.current.title = newerServerTrack.name;
          const currentPlayTime = newerServerTrack.getCurrentPlayTime();
          audioPlayer.current.audio.current.currentTime = currentPlayTime / 1000;
          if (newerServerTrack.isPaused) {
            audioPlayer.current.audio.current.pause();
          } else {
            try {
              await audioPlayer.current.audio.current.play();
            } catch (error) {
              if (error instanceof DOMException && error.name === 'NotAllowedError') {
                console.error(
                  `Play failed: User interaction with the document is required first. Original error: ${error}`
                );
                displayError('This is your first time using the app, please accept autoplay by hitting play :)');
              } else {
                console.error('An unexpected error occurred:', error);
              }
            }
          }
        } else {
          console.warn('audio player not available yet');
        }
      }

      // Handle short effect track
      const newEffect = syncResult.shortEffectTrack;
      if (newEffect && effectAudioRef.current) {
        console.info('playing short effect track:', newEffect.name);
        setShortEffectTrack(newEffect);
        effectAudioRef.current.src = newEffect.url;
        effectAudioRef.current.currentTime = 0;
        try {
          await effectAudioRef.current.play();
        } catch (error) {
          console.error('Failed to play short effect track:', error);
        }
      }
    }

    resyncOnUi();
    const id = setInterval(() => {
      resyncOnUi();
    }, SYNC_TRACK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [currentTrack, shortEffectTrack, sessionId]);

  return (
    <Container>
      <Header>
        <div style={{ width: '30%', minWidth: '0' }}></div>
        <Title>RPG-Maestro player UI</Title>
        <MaestroLink>
          <TextLinkWithIconWrapper
            link={`/maestro/${sessionId}`}
            text={'Maestro interface is available here'}
            materialUiIcon={SpatialAudioOffIcon}
          />
        </MaestroLink>
      </Header>

      <WelcomeText>
        <p>
          Welcome! This app is primarily meant for TTRPG games: a Maestro manages the current track being played, the
          track is synced between all Players on this page.
        </p>
        <p>To avoid sync issues, Players can only change their volume.</p>
      </WelcomeText>

      <StyledAudioPlayer
        ref={audioPlayer as LegacyRef<H5AudioPlayer>}
        loop={true}
        showJumpControls={false}
        showSkipControls={false}
        customAdditionalControls={undefined}
        className={'audio-player-readonly'}
        header={
          <div>
            <span>You are listening to:</span>
            <h3
              style={{
                fontSize: '1rem',
                lineHeight: '2em',
                maxHeight: '4em',
                textOverflow: 'revert',
                overflow: 'hidden',
                wordBreak: 'break-all',
              }}
            >
              {currentTrack?.name}
            </h3>
          </div>
        }
        customIcons={{
          pause: <MusicNoteIcon style={{ cursor: 'not-allowed' }} />,
        }}
      />

      <audio ref={effectAudioRef} style={{ display: 'none' }} />
      <GithubSourceCodeLink />
      <ToastContainer limit={5} />
    </Container>
  );
}
