import { CreateBetaSignupRequest, CreateLandingVisitRequest, parseAndValidateDto } from '@rpg-maestro/rpg-maestro-api-contract';
import { DatabaseWrapperConfiguration } from '../DatabaseWrapperConfiguration';
import { LandingService } from './landing.service';

describe('LandingService', () => {
  let databases: DatabaseWrapperConfiguration;
  let landingService: LandingService;

  beforeEach(() => {
    databases = new DatabaseWrapperConfiguration('in-memory');
    landingService = new LandingService(databases);
  });

  describe('beta signups', () => {
    it('persists a signup with its source and referrer', async () => {
      await landingService.createBetaSignup(
        new CreateBetaSignupRequest('gm@example.com', 'dmacademy-post', 'https://reddit.com/r/DMAcademy')
      );

      const signups = await databases.getBetaSignupsDB().getAll();
      expect(signups).toHaveLength(1);
      expect(signups[0].email).toBe('gm@example.com');
      expect(signups[0].source).toBe('dmacademy-post');
      expect(signups[0].referrer).toBe('https://reddit.com/r/DMAcademy');
      expect(new Date(signups[0].created_at).getTime()).not.toBeNaN();
    });

    it('dedupes signups by email, keeping the first one', async () => {
      await landingService.createBetaSignup(new CreateBetaSignupRequest('gm@example.com', 'first-source'));
      await landingService.createBetaSignup(new CreateBetaSignupRequest('GM@example.com', 'second-source'));

      const signups = await databases.getBetaSignupsDB().getAll();
      expect(signups).toHaveLength(1);
      expect(signups[0].source).toBe('first-source');
    });

    it('normalizes emails to lowercase', async () => {
      await landingService.createBetaSignup(new CreateBetaSignupRequest('GM@Example.COM'));

      const signups = await databases.getBetaSignupsDB().getAll();
      expect(signups[0].email).toBe('gm@example.com');
    });

    it('silently drops submissions with the honeypot field filled', async () => {
      await landingService.createBetaSignup(
        new CreateBetaSignupRequest('bot@example.com', undefined, undefined, 'https://spam.example.com')
      );

      expect(await databases.getBetaSignupsDB().getAll()).toHaveLength(0);
    });

    it('rejects an invalid email at DTO validation', async () => {
      await expect(parseAndValidateDto(CreateBetaSignupRequest, { email: 'not-an-email' })).rejects.toBeDefined();
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
