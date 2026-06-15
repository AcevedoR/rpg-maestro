import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { TrackCollection } from '@rpg-maestro/rpg-maestro-api-contract';

import { CreateCollectionForm, ImportFromSessionForm, TrackCollectionCreateComponent } from './track-collection-create';

const navigateMock = vi.hoisted(() => vi.fn());

const apiMocks = vi.hoisted(() => ({
  createTrackCollection: vi.fn(),
  importTrackCollectionFromSession: vi.fn(),
  getAllSessions: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('../maestro-api', () => ({
  createTrackCollection: apiMocks.createTrackCollection,
  importTrackCollectionFromSession: apiMocks.importTrackCollectionFromSession,
}));

vi.mock('../../admin-ui/admin-api', () => ({
  getAllSessions: apiMocks.getAllSessions,
}));

vi.mock('../../ui-components/toast-popup', () => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

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
      override: undefined,
    });
  });

  it('sets override=true when the overwrite checkbox is ticked', async () => {
    const onImport = vi.fn().mockResolvedValue(undefined);
    render(<ImportFromSessionForm sessionIds={[]} onImport={onImport} />);

    fireEvent.change(screen.getByLabelText('Session id'), { target: { value: 'session-abc' } });
    fireEvent.change(screen.getByLabelText('New collection id (unique)'), { target: { value: 'from-session' } });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Imported Collection' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Import from session' }));

    await waitFor(() => expect(onImport).toHaveBeenCalledTimes(1));
    expect(onImport).toHaveBeenCalledWith({
      sessionId: 'session-abc',
      id: 'from-session',
      name: 'Imported Collection',
      description: undefined,
      override: true,
    });
  });
});

describe('TrackCollectionCreateComponent', () => {
  const created: TrackCollection = {
    id: 'new-collection',
    name: 'New Collection',
    description: undefined,
    tracks: [],
    created_at: 0,
    updated_at: 0,
    created_by: 'user-1',
  };

  beforeEach(() => {
    navigateMock.mockReset();
    Object.values(apiMocks).forEach((mock) => mock.mockReset());
    apiMocks.getAllSessions.mockResolvedValue([]);
  });

  it('creates a collection then navigates to its edit page', async () => {
    apiMocks.createTrackCollection.mockResolvedValue(created);

    render(<TrackCollectionCreateComponent />);

    fireEvent.change(screen.getByLabelText('Id (unique)'), { target: { value: 'new-collection' } });
    fireEvent.change(screen.getAllByLabelText('Name')[0], { target: { value: 'New Collection' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create collection' }));

    await waitFor(() =>
      expect(apiMocks.createTrackCollection).toHaveBeenCalledWith({
        id: 'new-collection',
        name: 'New Collection',
        description: undefined,
        tracks: [],
      })
    );
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/maestro/track-collections/new-collection'));
  });
});
