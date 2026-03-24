import React from 'react';
import { SoundboardButton } from './soundboard-button';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import DoorFrontIcon from '@mui/icons-material/DoorFront';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

export function Soundboard() {
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
        <SoundboardButton text={'thunder'} icon={ThunderstormIcon} color={'#4a4a8a'} />
        <SoundboardButton text={'scream'} icon={RecordVoiceOverIcon} color={'#8a2a2a'} />
        <SoundboardButton text={'door open'} icon={DoorFrontIcon} color={'#7a5a1a'} />
        <SoundboardButton text={'door shut'} icon={MeetingRoomIcon} color={'#5a4a1a'} />
        <SoundboardButton text={'battle'} icon={GpsFixedIcon} color={'#7a0000'} />
        <SoundboardButton text={'explosion'} icon={LocalFireDepartmentIcon} color={'#a04000'} />
      </div>
    </div>
  );
}
