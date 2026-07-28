import { Injectable, Logger } from '@nestjs/common';

/**
 * How many playing-tracks streams this instance is holding open.
 *
 * Worth counting because a stream is a request that never ends: it occupies a connection slot for as
 * long as a listener stays on the page, so this number — not the request rate — is what tells you how
 * close an instance is to its concurrency limit. Reported by `GET /health`.
 */
@Injectable()
export class SessionStreamsRegistry {
  private readonly logger = new Logger(SessionStreamsRegistry.name);
  private open = 0;

  opened(sessionId: string): void {
    this.open++;
    this.logger.debug(`stream opened for session '${sessionId}', ${this.open} open on this instance`);
  }

  closed(sessionId: string): void {
    this.open--;
    this.logger.debug(`stream closed for session '${sessionId}', ${this.open} open on this instance`);
  }

  get openCount(): number {
    return this.open;
  }
}
