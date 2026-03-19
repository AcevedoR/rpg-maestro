import type { Meta, StoryObj } from '@storybook/react';
import { AdminBoardView } from './admin-board';
import { PlayingTrack, SessionPlayingTracks, User } from '@rpg-maestro/rpg-maestro-api-contract';

const meta: Meta<typeof AdminBoardView> = {
  title: 'Admin/AdminBoard',
  component: AdminBoardView,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof AdminBoardView>;

const now = Date.now();
const day = 24 * 60 * 60 * 1000;
const march9 = Date.UTC(2026, 2, 9, 12, 0, 0, 0);
const march13 = Date.UTC(2026, 2, 13, 12, 0, 0, 0);
const march18 = Date.UTC(2026, 2, 18, 12, 0, 0, 0);
const march21 = Date.UTC(2026, 2, 21, 12, 0, 0, 0);
const march25 = Date.UTC(2026, 2, 25, 12, 0, 0, 0);

const users: User[] = [
  {
    id: 'admin|001',
    created_at: now - day * 200,
    updated_at: march25,
    role: 'ADMIN',
    sessions: {
      'session-alpha': { created_at: now - day * 190, updated_at: now - day * 30, access: 'OWNER' },
      'session-beta': { created_at: now - day * 150, updated_at: now - day * 45, access: 'OWNER' },
    },
  },
  {
    id: 'maestro|002',
    created_at: now - day * 120,
    updated_at: march21,
    role: 'MAESTRO',
    sessions: {
      'session-gamma': { created_at: now - day * 100, updated_at: now - day * 12, access: 'OWNER' },
    },
  },
  {
    id: 'minstrel|003',
    created_at: now - day * 90,
    updated_at: march18,
    role: 'MINSTREL',
  },
  {
    id: 'minstrel|005',
    created_at: now - day * 60,
    updated_at: march9,
    role: 'MINSTREL',
  },
  {
    id: 'maestro|004',
    created_at: now - day * 80,
    updated_at: march13,
    role: 'MAESTRO',
    sessions: {
      'session-beta': { created_at: now - day * 75, updated_at: now - day * 7, access: 'OWNER' },
    },
  },
  {
    id: 'maestro|006',
    created_at: now - day * 45,
    updated_at: now - day * 4,
    role: 'MAESTRO',
    sessions: {
      'session-delta': { created_at: now - day * 40, updated_at: now - day * 4, access: 'OWNER' },
    },
  },
  {
    id: 'minstrel|007',
    created_at: now - day * 30,
    updated_at: march18,
    role: 'MINSTREL',
  },
  {
    id: 'admin|008',
    created_at: now - day * 10,
    updated_at: now - day * 1,
    role: 'ADMIN',
    sessions: {
      'session-epsilon': { created_at: now - day * 9, updated_at: now - day * 1, access: 'OWNER' },
      'session-zeta': { created_at: now - day * 8, updated_at: now - day * 1, access: 'OWNER' },
    },
  },
];

const sessions: SessionPlayingTracks[] = [
  {
    sessionId: 'session-alpha',
    currentTrack: new PlayingTrack(
      'track-01',
      'Twilight Alley Ambience',
      'https://example.com/tracks/twilight-alley.mp3',
      180000,
      false,
      now - 120000,
      22000
    ),
  },
  {
    sessionId: 'session-beta',
    currentTrack: new PlayingTrack(
      'track-02',
      'Clockwork Market',
      'https://example.com/tracks/clockwork-market.mp3',
      210000,
      true,
      now - 60000,
      80000
    ),
  },
  {
    sessionId: 'session-gamma',
    currentTrack: null,
  },
  {
    sessionId: 'session-delta',
    currentTrack: new PlayingTrack(
      'track-03',
      'River Moonlight',
      'https://example.com/tracks/river-moonlight.mp3',
      240000,
      false,
      now - 90000,
      15000
    ),
  },
  {
    sessionId: 'session-epsilon',
    currentTrack: new PlayingTrack(
      'track-04',
      'Smoldering Ruins',
      'https://example.com/tracks/smoldering-ruins.mp3',
      195000,
      false,
      now - 30000,
      5000
    ),
  },
];

export const Default: Story = {
  args: {
    user: users[0],
    users,
    sessions,
    usersSortModel: [{ field: 'updated_at', sort: 'asc' }],
  },
};
