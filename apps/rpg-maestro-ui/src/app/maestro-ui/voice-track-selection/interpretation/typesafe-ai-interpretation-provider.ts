import { InterpretTranscriptTagsRequest, InterpretTranscriptTagsResponse } from '@rpg-maestro/rpg-maestro-api-contract';
import {
  TagInterpretationInput,
  TagInterpretationProvider,
  TagInterpretationResult,
} from './tag-interpretation-provider';
import { interpretTranscriptTags } from './tag-interpretation-api';

export type InterpretTags = (
  request: InterpretTranscriptTagsRequest,
  signal?: AbortSignal
) => Promise<InterpretTranscriptTagsResponse>;

export interface TypesafeAiInterpretationProviderOptions {
  /**
   * Used when the backend interpreter cannot answer — typically because the server has no
   * TypeSafe AI credentials configured. Without a fallback the failure is propagated.
   */
  fallback?: TagInterpretationProvider;
  /** Injectable transport, for tests. */
  interpretTags?: InterpretTags;
}

/**
 * Asks the backend — which calls TypeSafe AI — for a primary and a secondary tag.
 *
 * All the judgement lives server-side: the model answers with labels drawn from the session's
 * own tags, each with a reported confidence, and the server keeps the candidates that reach
 * the confidence threshold. So this provider simply relays the tags it is given; if either of
 * the two candidates was confident enough, that is the tag (or tags) to play, and if neither
 * was, the list comes back empty and the soundboard leaves the music alone.
 */
export class TypesafeAiInterpretationProvider implements TagInterpretationProvider {
  readonly name = 'typesafe-ai';
  private readonly fallback?: TagInterpretationProvider;
  private readonly interpretTags: InterpretTags;

  constructor({ fallback, interpretTags = interpretTranscriptTags }: TypesafeAiInterpretationProviderOptions = {}) {
    this.fallback = fallback;
    this.interpretTags = interpretTags;
  }

  async interpret(input: TagInterpretationInput): Promise<TagInterpretationResult> {
    const { transcript, availableTags, signal } = input;
    if (availableTags.length === 0) {
      return { tags: [], provider: this.name, primary: null, secondary: null };
    }
    try {
      const response = await this.interpretTags(new InterpretTranscriptTagsRequest(transcript, availableTags), signal);
      return {
        tags: response.tags,
        provider: response.provider,
        primary: response.primary,
        secondary: response.secondary,
      };
    } catch (error) {
      if (!this.fallback || (error instanceof DOMException && error.name === 'AbortError')) {
        throw error;
      }
      console.warn(`AI tag interpretation unavailable, falling back to ${this.fallback.name}`, error);
      return this.fallback.interpret(input);
    }
  }
}
