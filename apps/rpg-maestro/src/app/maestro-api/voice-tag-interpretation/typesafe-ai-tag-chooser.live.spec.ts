import { TypesafeAiTagChooser } from './typesafe-ai-tag-chooser';
import { VoiceTagInterpretationService } from './voice-tag-interpretation.service';
import { InterpretTranscriptTagsRequest } from '@rpg-maestro/rpg-maestro-api-contract';

/**
 * Hits the real TypeSafe AI API, so it is skipped unless `TYPESAFE_API_KEY` is set.
 *
 * The rest of the suite stubs the chooser, which proves the confidence gating but not that
 * our request is one the API accepts, nor that the answers come back shaped the way the
 * gating expects. That is what this covers — run it after touching the questions:
 *
 *   TYPESAFE_API_KEY=... npx nx test rpg-maestro --testFile=...typesafe-ai-tag-chooser.live.spec.ts
 */
const describeWhenConfigured = process.env.TYPESAFE_API_KEY ? describe : describe.skip;

describeWhenConfigured('TypesafeAiTagChooser (live API)', () => {
  const availableTags = ['combat', 'forest', 'tavern', 'travel', 'mystery'];
  const service = new VoiceTagInterpretationService(new TypesafeAiTagChooser());

  it('reads a combat scene out of what the game master said', async () => {
    const result = await service.interpret(
      new InterpretTranscriptTagsRequest(
        'The orc warband bursts out of the treeline with swords drawn. Roll initiative!',
        availableTags
      )
    );

    console.info('live answer:', JSON.stringify(result));
    expect(result.provider).toBe('typesafe-ai');
    expect(result.primary?.tag).toBe('combat');
    expect(result.primary?.confidence).toBeGreaterThan(0);
    expect(result.primary?.confidence).toBeLessThanOrEqual(1);
    expect(result.tags[0]).toBe('combat');
    // every returned tag is one the session actually has
    for (const tag of result.tags) {
      expect(availableTags).toContain(tag);
    }
  }, 30_000);

  it('abstains on a transcript that describes no scene at all', async () => {
    const result = await service.interpret(
      new InterpretTranscriptTagsRequest(
        'Hang on, I need to find my dice. Did anyone order the pizza yet?',
        availableTags
      )
    );

    console.info('live answer (no scene):', JSON.stringify(result));
    // either the model abstained, or nothing cleared the confidence threshold
    expect(result.tags).toEqual([]);
  }, 30_000);
});
