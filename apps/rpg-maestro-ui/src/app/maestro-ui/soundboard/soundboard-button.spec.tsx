import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { SoundboardButton } from './soundboard-button';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';

describe('SoundboardButton', () => {
  it('renders the text and icon', () => {
    render(<SoundboardButton text="thunder" icon={ThunderstormIcon} color="#4a4a8a" onPlay={vi.fn()} />);

    expect(screen.getByText('thunder')).toBeDefined();
    expect(screen.getByTestId('ThunderstormIcon')).toBeDefined();
  });

  it('calls onPlay when clicked', async () => {
    const onPlay = vi.fn();

    render(<SoundboardButton text="thunder" icon={ThunderstormIcon} color="#4a4a8a" onPlay={onPlay} />);

    await userEvent.click(screen.getByRole('button'));

    expect(onPlay).toHaveBeenCalledOnce();
  });

  it('applies the given color', () => {
    render(<SoundboardButton text="thunder" icon={ThunderstormIcon} color="#ff0000" onPlay={vi.fn()} />);

    const button = screen.getByRole('button');
    expect(button.style.color).toBe('rgb(255, 0, 0)');
  });
});
