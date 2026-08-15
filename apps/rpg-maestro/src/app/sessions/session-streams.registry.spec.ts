import { SessionStreamsRegistry } from './session-streams.registry';

describe('SessionStreamsRegistry', () => {
  it('counts open streams per session and in total', () => {
    const registry = new SessionStreamsRegistry();

    registry.opened('session-a');
    registry.opened('session-a');
    registry.opened('session-b');

    expect(registry.openCountFor('session-a')).toBe(2);
    expect(registry.openCountFor('session-b')).toBe(1);
    expect(registry.openCount).toBe(3);
  });

  it('uncounts closed streams down to zero', () => {
    const registry = new SessionStreamsRegistry();

    registry.opened('session-a');
    registry.opened('session-a');
    registry.closed('session-a');
    expect(registry.openCountFor('session-a')).toBe(1);

    registry.closed('session-a');
    expect(registry.openCountFor('session-a')).toBe(0);
    expect(registry.openCount).toBe(0);
  });

  it('reports zero for a session it never saw', () => {
    const registry = new SessionStreamsRegistry();

    expect(registry.openCountFor('never-seen')).toBe(0);
  });

  it('snapshots the counts of every session with open streams', () => {
    const registry = new SessionStreamsRegistry();

    registry.opened('session-a');
    registry.opened('session-a');
    registry.opened('session-b');
    registry.closed('session-b');

    expect(registry.countsBySession()).toEqual({ 'session-a': 2 });
  });

  it('notifies change listeners on every open and close', () => {
    const registry = new SessionStreamsRegistry();
    let notified = 0;
    registry.onChange(() => notified++);

    registry.opened('session-a');
    registry.closed('session-a');

    expect(notified).toBe(2);
  });
});
