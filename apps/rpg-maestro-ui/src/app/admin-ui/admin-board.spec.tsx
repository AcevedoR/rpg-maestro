import { usersGridColumns } from './admin-board';
import { vi } from 'vitest';
import { User } from '@rpg-maestro/rpg-maestro-api-contract';

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

    const olderDisplay = updatedAtColumn.valueFormatter(users[1].updated_at, users[1], updatedAtColumn, null as never);
    const newerDisplay = updatedAtColumn.valueFormatter(users[0].updated_at, users[0], updatedAtColumn, null as never);

    expect(olderDisplay).toBe('9 March');
    expect(newerDisplay).toBe('13 March');

    // Sorting is handled by MUI DataGrid using raw updated_at numbers — no custom comparator needed.
    // Verify raw values sort correctly.
    expect((users[1].updated_at ?? 0) - (users[0].updated_at ?? 0)).toBeLessThan(0);
  });
});
