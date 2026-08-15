import { overviewGridColumns, usersGridColumns } from './admin-board';
import { vi } from 'vitest';
import { AdminSessionOverview, PlayingTrack, User } from '@rpg-maestro/rpg-maestro-api-contract';

vi.mock('../utils/time', () => ({
  formatTodayDate: (timestamp: number) => {
    if (timestamp === 1000) {
      return '9 March';
    }
    if (timestamp === 2000) {
      return '13 March';
    }
    return '';
  },
}));

describe('AdminBoardView', () => {
  it('formats updated_at using valueFormatter and shows March dates', () => {
    const users: User[] = [
      {
        id: 'user-1',
        created_at: 100,
        updated_at: 2000,
        role: 'ADMIN',
        sessions: {},
      },
      {
        id: 'user-2',
        created_at: 200,
        updated_at: 1000,
        role: 'MAESTRO',
        sessions: {},
      },
    ];

    const updatedAtColumn = usersGridColumns.find((column) => column.field === 'updated_at');
    if (!updatedAtColumn || !updatedAtColumn.valueFormatter) {
      throw new Error('updated_at column is missing expected configuration');
    }

    const format = updatedAtColumn.valueFormatter as (value: number) => string;

    const olderDisplay = format(users[1].updated_at);
    const newerDisplay = format(users[0].updated_at);

    expect(olderDisplay).toBe('9 March');
    expect(newerDisplay).toBe('13 March');

    // Sorting is done natively on raw numeric timestamps
    expect(users[1].updated_at).toBeLessThan(users[0].updated_at);
  });
});

describe('overviewGridColumns', () => {
  const aTrack = (isPaused: boolean): PlayingTrack =>
    new PlayingTrack('track-1', 'Tavern Brawl', 'https://example.com/tavern-brawl.mp3', 180000, isPaused, 1000, 0);
  const anOverviewRow = (overrides: Partial<AdminSessionOverview>): AdminSessionOverview => ({
    sessionId: 'session-1',
    gms: [],
    connectedPlayers: 0,
    currentTrack: null,
    ...overrides,
  });
  const columnValue = (field: string, row: AdminSessionOverview): unknown => {
    const column = overviewGridColumns.find((c) => c.field === field);
    if (!column || !column.valueGetter) {
      throw new Error(`${field} column is missing expected configuration`);
    }
    const getValue = column.valueGetter as (value: unknown, row: AdminSessionOverview) => unknown;
    return getValue(row[field as keyof AdminSessionOverview], row);
  };

  it('derives the session status from the current track', () => {
    expect(columnValue('status', anOverviewRow({ currentTrack: null }))).toBe('idle');
    expect(columnValue('status', anOverviewRow({ currentTrack: aTrack(true) }))).toBe('paused');
    expect(columnValue('status', anOverviewRow({ currentTrack: aTrack(false) }))).toBe('playing');
  });

  it('shows the current track name', () => {
    expect(columnValue('currentTrack', anOverviewRow({ currentTrack: aTrack(false) }))).toBe('Tavern Brawl');
    expect(columnValue('currentTrack', anOverviewRow({ currentTrack: null }))).toBeUndefined();
  });

  it('joins the session GMs into one cell', () => {
    expect(columnValue('gms', anOverviewRow({ gms: ['gm-1@x.io', 'gm-2@x.io'] }))).toBe('gm-1@x.io, gm-2@x.io');
    expect(columnValue('gms', anOverviewRow({ gms: [] }))).toBe('');
  });
});
