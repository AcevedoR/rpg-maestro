import { Injectable, Logger } from '@nestjs/common';

/**
 * How many playing-tracks streams this instance is holding open.
 *
 * Worth counting because a stream is a request that never ends: it occupies a connection slot for as
 * long as a listener stays on the page, so this number — not the request rate — is what tells you how
 * close an instance is to its concurrency limit. Reported by `GET /health`.
 *
 * Also kept per session, so the admin overview can say how many players are listening to each one.
 */
@Injectable()
export class SessionStreamsRegistry {
  private readonly logger = new Logger(SessionStreamsRegistry.name);
  private readonly openBySession = new Map<string, number>();
  private readonly changeListeners: Array<() => void> = [];

  opened(sessionId: string): void {
    this.openBySession.set(sessionId, this.openCountFor(sessionId) + 1);
    this.logger.debug(`stream opened for session '${sessionId}', ${this.openCount} open on this instance`);
    this.notifyChange();
  }

  closed(sessionId: string): void {
    const remaining = this.openCountFor(sessionId) - 1;
    if (remaining > 0) {
      this.openBySession.set(sessionId, remaining);
    } else {
      this.openBySession.delete(sessionId);
    }
    this.logger.debug(`stream closed for session '${sessionId}', ${this.openCount} open on this instance`);
    this.notifyChange();
  }

  /** Called after every open/close, so presence tracking can report fresh counts without polling. */
  onChange(listener: () => void): void {
    this.changeListeners.push(listener);
  }

  get openCount(): number {
    let total = 0;
    for (const open of this.openBySession.values()) {
      total += open;
    }
    return total;
  }

  openCountFor(sessionId: string): number {
    return this.openBySession.get(sessionId) ?? 0;
  }

  countsBySession(): Record<string, number> {
    return Object.fromEntries(this.openBySession);
  }

  private notifyChange(): void {
    for (const listener of this.changeListeners) {
      listener();
    }
  }
}
