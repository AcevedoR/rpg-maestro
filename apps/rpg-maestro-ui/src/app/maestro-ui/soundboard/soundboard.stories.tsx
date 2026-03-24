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

export const Default: Story = {
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
