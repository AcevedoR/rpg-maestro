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
  it('sorts users by updated_at and shows March dates', () => {
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
    if (!updatedAtColumn || !updatedAtColumn.valueGetter || !updatedAtColumn.sortComparator) {
      throw new Error('updated_at column is missing expected configuration');
    }

    const olderDisplay = updatedAtColumn.valueGetter(users[1].updated_at, users[1]);
    const newerDisplay = updatedAtColumn.valueGetter(users[0].updated_at, users[0]);

    expect(olderDisplay).toBe('9 March');
    expect(newerDisplay).toBe('13 March');

    const comparatorResult = updatedAtColumn.sortComparator(
      olderDisplay,
      newerDisplay,
      { row: users[1] } as never,
      { row: users[0] } as never
    );

    expect(comparatorResult).toBeLessThan(0);
  });
});
