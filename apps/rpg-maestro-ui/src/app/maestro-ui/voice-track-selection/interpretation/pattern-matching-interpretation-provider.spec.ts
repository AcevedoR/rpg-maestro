import { describe, expect, it } from 'vitest';
import { PatternMatchingInterpretationProvider } from './pattern-matching-interpretation-provider';

describe('PatternMatchingInterpretationProvider', () => {
  const provider = new PatternMatchingInterpretationProvider();
  const availableTags = ['combat', 'settlement', 'forest', 'travel', 'dungeon'];

  it('maps combat keywords (sword, bow) to the combat tag', async () => {
    const result = await provider.interpret({
      transcript: 'The orc raises his sword and the ranger draws her bow!',
      availableTags,
    });
    expect(result.tags).toEqual(['combat']);
    expect(result.provider).toBe('pattern-matching');
  });

  it('matches multiple distinct scenes in one transcript', async () => {
    const result = await provider.interpret({
      transcript: 'You leave the village and travel through the dark forest.',
      availableTags,
    });
    expect(result.tags).toContain('settlement');
    expect(result.tags).toContain('travel');
    expect(result.tags).toContain('forest');
  });

  it('only returns tags that exist in the session', async () => {
    const result = await provider.interpret({
      transcript: 'A goblin ambush in the woods!',
      availableTags: ['combat'], // forest is intentionally absent
    });
    expect(result.tags).toEqual(['combat']);
  });

  it('matches when the transcript literally names an available tag', async () => {
    const result = await provider.interpret({
      transcript: 'Switch to something more mystery themed.',
      availableTags: ['combat', 'mystery'],
    });
    expect(result.tags).toEqual(['mystery']);
  });

  it('does not match keywords embedded inside larger words', async () => {
    const result = await provider.interpret({
      transcript: 'The swordfish swam past the crown.',
      availableTags,
    });
    expect(result.tags).toEqual([]);
  });

  it('returns no tags when nothing matches', async () => {
    const result = await provider.interpret({
      transcript: 'Everyone sits quietly and reads a book.',
      availableTags,
    });
    expect(result.tags).toEqual([]);
  });
});
