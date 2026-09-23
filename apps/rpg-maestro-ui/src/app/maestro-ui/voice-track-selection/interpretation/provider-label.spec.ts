import { describe, expect, it } from 'vitest';
import { VoiceInterpretationConfig } from '@rpg-maestro/rpg-maestro-api-contract';
import { describeInterpretationProvider } from './provider-label';

const config = (overrides: Partial<VoiceInterpretationConfig> = {}): VoiceInterpretationConfig => ({
  provider: 'typesafe-ai',
  isAvailable: true,
  model: null,
  confidenceThreshold: 0.6,
  ...overrides,
});

describe('describeInterpretationProvider', () => {
  it('names the provider that is answering', () => {
    expect(describeInterpretationProvider(config())).toBe('using TypeSafe AI');
  });

  it('includes the model when the server pins one', () => {
    expect(describeInterpretationProvider(config({ model: 'jev-1.13.0' }))).toBe('using TypeSafe AI (jev-1.13.0)');
  });

  it('names the local fallback, not the idle provider, when the server has no credentials', () => {
    const label = describeInterpretationProvider(config({ isAvailable: false, model: 'jev-1.13.0' }));

    expect(label).toBe('using keyword matching — no AI provider configured on the server');
    expect(label).not.toContain('TypeSafe AI');
    expect(label).not.toContain('jev-1.13.0');
  });

  it('shows an unrecognised provider id verbatim rather than hiding it', () => {
    expect(describeInterpretationProvider(config({ provider: 'some-new-llm' }))).toBe('using some-new-llm');
  });

  it('says nothing when the config could not be read', () => {
    expect(describeInterpretationProvider(null)).toBeNull();
  });
});
