import {
  CreateLandingEventRequest,
  CreateLandingVisitRequest,
  CreateUpgradeInterestRequest,
  parseAndValidateDto,
} from '@rpg-maestro/rpg-maestro-api-contract';
import { DatabaseWrapperConfiguration } from '../DatabaseWrapperConfiguration';
import { LandingService } from './landing.service';

describe('LandingService', () => {
  let databases: DatabaseWrapperConfiguration;
  let landingService: LandingService;

  beforeEach(() => {
    databases = new DatabaseWrapperConfiguration('in-memory');
    landingService = new LandingService(databases);
  });

  describe('upgrade interest', () => {
    it('persists an upgrade interest with its source, referrer and had_session marker', async () => {
      await landingService.createUpgradeInterest(
        new CreateUpgradeInterestRequest('gm@example.com', 'dmacademy-post', 'https://reddit.com/r/DMAcademy', true)
      );

      const upgradeInterests = await databases.getUpgradeInterestDB().getAll();
      expect(upgradeInterests).toHaveLength(1);
      expect(upgradeInterests[0].email).toBe('gm@example.com');
      expect(upgradeInterests[0].source).toBe('dmacademy-post');
      expect(upgradeInterests[0].referrer).toBe('https://reddit.com/r/DMAcademy');
      expect(upgradeInterests[0].had_session).toBe(true);
      expect(new Date(upgradeInterests[0].created_at).getTime()).not.toBeNaN();
    });

    it('defaults had_session to false when not provided', async () => {
      await landingService.createUpgradeInterest(new CreateUpgradeInterestRequest('gm@example.com'));

      const upgradeInterests = await databases.getUpgradeInterestDB().getAll();
      expect(upgradeInterests[0].had_session).toBe(false);
    });

    it('dedupes upgrade interests by email, keeping the first one', async () => {
      await landingService.createUpgradeInterest(new CreateUpgradeInterestRequest('gm@example.com', 'first-source'));
      await landingService.createUpgradeInterest(new CreateUpgradeInterestRequest('GM@example.com', 'second-source'));

      const upgradeInterests = await databases.getUpgradeInterestDB().getAll();
      expect(upgradeInterests).toHaveLength(1);
      expect(upgradeInterests[0].source).toBe('first-source');
    });

    it('normalizes emails to lowercase', async () => {
      await landingService.createUpgradeInterest(new CreateUpgradeInterestRequest('GM@Example.COM'));

      const upgradeInterests = await databases.getUpgradeInterestDB().getAll();
      expect(upgradeInterests[0].email).toBe('gm@example.com');
    });

    it('silently drops submissions with the honeypot field filled', async () => {
      await landingService.createUpgradeInterest(
        new CreateUpgradeInterestRequest('bot@example.com', undefined, undefined, undefined, 'https://spam.example.com')
      );

      expect(await databases.getUpgradeInterestDB().getAll()).toHaveLength(0);
    });

    it('rejects an invalid email at DTO validation', async () => {
      await expect(parseAndValidateDto(CreateUpgradeInterestRequest, { email: 'not-an-email' })).rejects.toBeDefined();
    });
  });

  describe('landing events', () => {
    it('increments a daily count per event type and source', async () => {
      await landingService.recordLandingEvent(new CreateLandingEventRequest('start_free_clicked', 'dmacademy-post'));
      await landingService.recordLandingEvent(new CreateLandingEventRequest('start_free_clicked', 'dmacademy-post'));
      await landingService.recordLandingEvent(new CreateLandingEventRequest('session_created', 'dmacademy-post'));

      const counts = await databases.getLandingEventsDB().getAll();
      expect(counts).toHaveLength(2);
      const byType = Object.fromEntries(counts.map((c) => [c.type, c.count]));
      expect(byType['start_free_clicked']).toBe(2);
      expect(byType['session_created']).toBe(1);
    });

    it('rejects an unknown event type at DTO validation', async () => {
      await expect(parseAndValidateDto(CreateLandingEventRequest, { type: 'not-an-event' })).rejects.toBeDefined();
    });
  });

  describe('landing visits', () => {
    it('increments a daily count per source', async () => {
      await landingService.recordLandingVisit(new CreateLandingVisitRequest('dmacademy-post'));
      await landingService.recordLandingVisit(new CreateLandingVisitRequest('dmacademy-post'));
      await landingService.recordLandingVisit(new CreateLandingVisitRequest('discord-pinned'));

      const counts = await databases.getLandingVisitsDB().getAll();
      expect(counts).toHaveLength(2);
      const bySource = Object.fromEntries(counts.map((c) => [c.source, c.count]));
      expect(bySource['dmacademy-post']).toBe(2);
      expect(bySource['discord-pinned']).toBe(1);
    });

    it('records visits without a source under "direct"', async () => {
      await landingService.recordLandingVisit(new CreateLandingVisitRequest());

      const counts = await databases.getLandingVisitsDB().getAll();
      expect(counts).toHaveLength(1);
      expect(counts[0].source).toBe('direct');
      expect(counts[0].count).toBe(1);
    });
  });
});
