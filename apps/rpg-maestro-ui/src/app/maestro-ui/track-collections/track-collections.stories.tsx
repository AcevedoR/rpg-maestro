import type { Meta, StoryObj } from '@storybook/react';
import { expect } from '@storybook/jest';
import { within } from '@storybook/testing-library';

import { TrackCollectionsContent } from './track-collections';

const meta: Meta<typeof TrackCollectionsContent> = {
  title: 'Maestro/TrackCollections',
  component: TrackCollectionsContent,
};

export default meta;

type Story = StoryObj<typeof TrackCollectionsContent>;

export const Default: Story = {
  args: {
    isLoading: false,
    errorMessage: null,
    trackCollections: [
      {
        id: 'collection-1',
        name: 'Dungeon Crawl',
        description: 'Dark and tense loops',
        tracks: [
          {
            id: 'track-1',
            source: { origin_media: 'remote', origin_url: 'http://localhost/intro', origin_name: 'Remote' },
            name: 'Intro',
            tags: ['dungeon'],
            url: 'http://localhost/intro',
            duration: 120,
          },
          {
            id: 'track-2',
            source: { origin_media: 'remote', origin_url: 'http://localhost/ambience', origin_name: 'Remote' },
            name: 'Ambience',
            tags: ['dungeon'],
            url: 'http://localhost/ambience',
            duration: 240,
          },
        ],
        created_at: 0,
        updated_at: 0,
        created_by: 'user-1',
      },
    ],
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Dungeon Crawl')).toBeTruthy();
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    errorMessage: null,
    trackCollections: [],
  },
};

export const Empty: Story = {
  args: {
    isLoading: false,
    errorMessage: null,
    trackCollections: [],
  },
};

export const WithSessionId: Story = {
  args: {
    isLoading: false,
    errorMessage: null,
    sessionId: 'session-123',
    onImport: async (collectionId: string) => {
      console.info('Import collection', collectionId);
    },
    trackCollections: [
      {
        id: 'collection-1',
        name: 'Dungeon Crawl',
        description: 'Dark and tense loops',
        tracks: [
          {
            id: 'track-1',
            source: { origin_media: 'remote', origin_url: 'http://localhost/intro', origin_name: 'Remote' },
            name: 'Intro',
            tags: ['dungeon'],
            url: 'http://localhost/intro',
            duration: 120,
          },
        ],
        created_at: 0,
        updated_at: 0,
        created_by: 'user-1',
      },
    ],
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Import to session')).toBeTruthy();
  },
};
