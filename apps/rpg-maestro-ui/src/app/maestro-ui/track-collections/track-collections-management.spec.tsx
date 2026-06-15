import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { TrackCollection } from '@rpg-maestro/rpg-maestro-api-contract';

import { CreateCollectionForm, EditableCollectionCard, ImportFromSessionForm } from './track-collections-management';

describe('CreateCollectionForm', () => {
  it('creates a fresh empty collection with the entered id and name', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<CreateCollectionForm onCreate={onCreate} />);

    const createButton = screen.getByRole('button', { name: 'Create collection' }) as HTMLButtonElement;
    expect(createButton.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('Id (unique)'), { target: { value: 'forest-ambience' } });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Forest Ambience' } });
    fireEvent.click(createButton);

    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1));
    expect(onCreate).toHaveBeenCalledWith({
      id: 'forest-ambience',
      name: 'Forest Ambience',
      description: undefined,
      tracks: [],
    });
  });
});

describe('ImportFromSessionForm', () => {
  it('imports a collection from a session using the entered ids and name', async () => {
    const onImport = vi.fn().mockResolvedValue(undefined);
    render(<ImportFromSessionForm sessionIds={['session-abc']} onImport={onImport} />);

    fireEvent.change(screen.getByLabelText('Session id'), { target: { value: 'session-abc' } });
    fireEvent.change(screen.getByLabelText('New collection id (unique)'), { target: { value: 'from-session' } });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Imported Collection' } });
    fireEvent.click(screen.getByRole('button', { name: 'Import from session' }));

    await waitFor(() => expect(onImport).toHaveBeenCalledTimes(1));
    expect(onImport).toHaveBeenCalledWith({
      sessionId: 'session-abc',
      id: 'from-session',
      name: 'Imported Collection',
      description: undefined,
    });
  });
});

describe('EditableCollectionCard', () => {
  const collection: TrackCollection = {
    id: 'collection-1',
    name: 'Town Ambience',
    description: 'Busy market loops',
    tracks: [
      {
        id: 'track-1',
        source: { origin_media: 'remote', origin_url: 'http://localhost/1', origin_name: 'Remote' },
        name: 'Market',
        tags: ['ambient'],
        url: 'http://localhost/1',
        duration: 90,
      },
    ],
    created_at: 0,
    updated_at: 0,
    created_by: 'user-1',
  };

  it('adds a manual track and saves the full update payload', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(<EditableCollectionCard collection={collection} onSave={onSave} onDelete={onDelete} />);

    expect(screen.getByText('Market')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Track URL'), { target: { value: 'http://localhost/2' } });
    fireEvent.change(screen.getByLabelText('Track name'), { target: { value: 'Tavern' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add track' }));

    expect(screen.getByText('Tavern')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith('collection-1', {
      id: 'collection-1',
      name: 'Town Ambience',
      description: 'Busy market loops',
      tracks: [
        { source: collection.tracks[0].source, name: 'Market', tags: ['ambient'], url: 'http://localhost/1' },
        {
          source: { origin_media: 'manual', origin_url: 'http://localhost/2', origin_name: 'Tavern' },
          name: 'Tavern',
          tags: [],
          url: 'http://localhost/2',
        },
      ],
    });
  });

  it('removes a track before saving', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(<EditableCollectionCard collection={collection} onSave={onSave} onDelete={onDelete} />);

    fireEvent.click(screen.getByLabelText('Remove Market'));
    expect(screen.queryByText('Market')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith('collection-1', {
      id: 'collection-1',
      name: 'Town Ambience',
      description: 'Busy market loops',
      tracks: [],
    });
  });

  it('deletes the collection', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(<EditableCollectionCard collection={collection} onSave={onSave} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete collection' }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
    expect(onDelete).toHaveBeenCalledWith('collection-1');
  });
});
