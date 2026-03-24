import React from 'react';
import { SvgIconComponent } from '@mui/icons-material';
import { Track } from '@rpg-maestro/rpg-maestro-api-contract';
import { SoundboardButton } from './soundboard-button';
import { Color } from '../tracks-table/quick-tag-selection';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import DoorFrontIcon from '@mui/icons-material/DoorFront';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

const ICON_MAP: Record<string, SvgIconComponent> = {
  thunder: ThunderstormIcon,
  scream: RecordVoiceOverIcon,
  'door open': DoorFrontIcon,
  'door shut': MeetingRoomIcon,
  battle: GpsFixedIcon,
  explosion: LocalFireDepartmentIcon,
};

const COLOR_MAP: Record<string, Color> = {
  thunder: '#4a4a8a',
  scream: '#8a2a2a',
  'door open': '#7a5a1a',
  'door shut': '#5a4a1a',
  battle: '#7a0000',
  explosion: '#a04000',
};

const DEFAULT_COLOR: Color = '#888888';

interface SoundboardProps {
  tracks: Track[];
  onPlay: (trackId: string) => void;
}

export function Soundboard({ tracks, onPlay }: SoundboardProps) {
  return (
    <div style={{ display: 'inline-flex', justifyContent: 'flex-start', width: '250px' }}>
      <h5
        style={{
          textOrientation: 'upright',
          writingMode: 'vertical-rl',
          margin: '0',
          color: 'var(--gold-color)',
          textAlign: 'center',
        }}
      >
        SOUNDBOARD
      </h5>
      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', margin: '0' }}>
        {tracks.map((track) => (
          <SoundboardButton
            key={track.id}
            text={track.name}
            icon={ICON_MAP[track.name.toLowerCase()] ?? VolumeUpIcon}
            color={COLOR_MAP[track.name.toLowerCase()] ?? DEFAULT_COLOR}
            onPlay={() => onPlay(track.id)}
          />
        ))}
      </div>
    </div>
  );
}
