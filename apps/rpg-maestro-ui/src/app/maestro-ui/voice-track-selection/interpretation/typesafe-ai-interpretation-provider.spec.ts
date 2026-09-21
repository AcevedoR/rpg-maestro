import { describe, expect, it, vi } from 'vitest';
import { InterpretTranscriptTagsResponse } from '@rpg-maestro/rpg-maestro-api-contract';
import { TypesafeAiInterpretationProvider } from './typesafe-ai-interpretation-provider';
import { PatternMatchingInterpretationProvider } from './pattern-matching-interpretation-provider';

const response = (overrides: Partial<InterpretTranscriptTagsResponse> = {}): InterpretTranscriptTagsResponse => ({
  tags: ['combat'],
  primary: { tag: 'combat', confidence: 0.9, isConfident: true },
  secondary: { tag: 'forest', confidence: 0.3, isConfident: false },
  confidenceThreshold: 0.6,
  provider: 'typesafe-ai',
  ...overrides,
});

describe('TypesafeAiInterpretationProvider', () => {
  const availableTags = ['combat', 'forest', 'tavern'];

  it('relays the tags the backend judged confident, with both candidates', async () => {
    const interpretTags = vi.fn().mockResolvedValue(response());
    const provider = new TypesafeAiInterpretationProvider({ interpretTags });

    const result = await provider.interpret({ transcript: 'The orcs charge!', availableTags });

    expect(result.tags).toEqual(['combat']);
    expect(result.primary).toEqual({ tag: 'combat', confidence: 0.9, isConfident: true });
    expect(result.secondary).toEqual({ tag: 'forest', confidence: 0.3, isConfident: false });
    expect(result.provider).toBe('typesafe-ai');
    expect(interpretTags).toHaveBeenCalledWith({ transcript: 'The orcs charge!', availableTags }, undefined);
  });

  it('returns no tags when the backend found neither candidate confident', async () => {
    const interpretTags = vi.fn().mockResolvedValue(response({ tags: [] }));
    const provider = new TypesafeAiInterpretationProvider({ interpretTags });

    const result = await provider.interpret({ transcript: 'Uhh, hang on.', availableTags });

    expect(result.tags).toEqual([]);
  });

  it('does not call the backend when the session has no tags', async () => {
    const interpretTags = vi.fn();
    const provider = new TypesafeAiInterpretationProvider({ interpretTags });

    const result = await provider.interpret({ transcript: 'The orcs charge!', availableTags: [] });

    expect(result.tags).toEqual([]);
    expect(interpretTags).not.toHaveBeenCalled();
  });

  it('falls back to the keyword matcher when the backend is unavailable', async () => {
    const interpretTags = vi.fn().mockRejectedValue(new Error('interpret-tags failed with status 503'));
    const provider = new TypesafeAiInterpretationProvider({
      interpretTags,
      fallback: new PatternMatchingInterpretationProvider(),
    });

    const result = await provider.interpret({ transcript: 'The orc raises his sword!', availableTags });

    expect(result.tags).toEqual(['combat']);
    expect(result.provider).toBe('pattern-matching');
  });

  it('propagates the failure when there is no fallback', async () => {
    const interpretTags = vi.fn().mockRejectedValue(new Error('interpret-tags failed with status 500'));
    const provider = new TypesafeAiInterpretationProvider({ interpretTags });

    await expect(provider.interpret({ transcript: 'The orcs charge!', availableTags })).rejects.toThrow('status 500');
  });

  it('propagates a cancellation instead of falling back', async () => {
    const interpretTags = vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError'));
    const provider = new TypesafeAiInterpretationProvider({
      interpretTags,
      fallback: new PatternMatchingInterpretationProvider(),
    });

    await expect(provider.interpret({ transcript: 'The orc raises his sword!', availableTags })).rejects.toThrow(
      'aborted'
    );
  });
});
