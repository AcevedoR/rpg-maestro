import type { Meta, StoryObj } from '@storybook/react';
import { expect } from '@storybook/jest';
import { within } from '@storybook/testing-library';

import { Soundboard } from './soundboard';

const meta: Meta<typeof Soundboard> = {
  title: 'Maestro/Soundboard',
  component: Soundboard,
};

export default meta;

type Story = StoryObj<typeof Soundboard>;

const mockTracks = [
  { id: '1', name: 'thunder', tags: ['soundboard'], url: 'https://cdn.freesound.org/previews/848/848968_17559721-lq.mp3', duration: 5, sessionId: 'demo', created_at: 0, updated_at: 0, source: { origin_media: 'remote', origin_url: '', origin_name: '' } },
  { id: '2', name: 'scream', tags: ['soundboard'], url: 'https://cdn.freesound.org/previews/848/848968_17559721-lq.mp3', duration: 3, sessionId: 'demo', created_at: 0, updated_at: 0, source: { origin_media: 'remote', origin_url: '', origin_name: '' } },
  { id: '3', name: 'door open', tags: ['soundboard'], url: 'https://cdn.freesound.org/previews/848/848968_17559721-lq.mp3', duration: 2, sessionId: 'demo', created_at: 0, updated_at: 0, source: { origin_media: 'remote', origin_url: '', origin_name: '' } },
  { id: '4', name: 'door shut', tags: ['soundboard'], url: 'https://cdn.freesound.org/previews/848/848968_17559721-lq.mp3', duration: 2, sessionId: 'demo', created_at: 0, updated_at: 0, source: { origin_media: 'remote', origin_url: '', origin_name: '' } },
  { id: '5', name: 'battle', tags: ['soundboard'], url: 'https://cdn.freesound.org/previews/848/848968_17559721-lq.mp3', duration: 10, sessionId: 'demo', created_at: 0, updated_at: 0, source: { origin_media: 'remote', origin_url: '', origin_name: '' } },
  { id: '6', name: 'explosion', tags: ['soundboard'], url: 'https://cdn.freesound.org/previews/848/848968_17559721-lq.mp3', duration: 4, sessionId: 'demo', created_at: 0, updated_at: 0, source: { origin_media: 'remote', origin_url: '', origin_name: '' } },
];

export const Default: Story = {
  args: {
    tracks: mockTracks,
    onPlay: (trackId: string) => console.info('play', trackId),
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('thunder')).toBeTruthy();
    await expect(canvas.getByText('scream')).toBeTruthy();
    await expect(canvas.getByText('door open')).toBeTruthy();
    await expect(canvas.getByText('door shut')).toBeTruthy();
    await expect(canvas.getByText('battle')).toBeTruthy();
    await expect(canvas.getByText('explosion')).toBeTruthy();
  },
};

export const WithUnknownTrack: Story = {
  args: {
    tracks: [
      { id: '7', name: 'unknown sfx', tags: ['soundboard'], url: 'https://cdn.freesound.org/previews/848/848968_17559721-lq.mp3', duration: 3, sessionId: 'demo', created_at: 0, updated_at: 0, source: { origin_media: 'remote', origin_url: '', origin_name: '' } },
    ],
    onPlay: (trackId: string) => console.info('play', trackId),
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('unknown sfx')).toBeTruthy();
  },
};
