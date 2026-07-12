import { Tag } from '@rpg-maestro/rpg-maestro-api-contract';

/**
 * Provider-agnostic contract for turning a spoken transcript into a list of track tags
 * to play, given the tags actually available in the current session.
 *
 * The first concrete implementation is a deterministic keyword matcher
 * ({@link PatternMatchingInterpretationProvider}) standing in for a real LLM. Future
 * providers (e.g. an actual LLM call built from {@link buildTagInterpretationPrompt})
 * implement the same interface and can be swapped in via the registry.
 */

export interface TagInterpretationInput {
  /** The transcript of what the maestro said. */
  transcript: string;
  /** Every tag that exists across the session's tracks — the allowed output vocabulary. */
  availableTags: Tag[];
}

export interface TagInterpretationResult {
  /** Tags to play, all guaranteed to be members of `availableTags`. */
  tags: Tag[];
  /** Name of the provider that produced this result. */
  provider: string;
}

export interface TagInterpretationProvider {
  /** Stable identifier used in logs and results. */
  readonly name: string;
  /** Map a transcript + available tags to the subset of tags that should play. */
  interpret(input: TagInterpretationInput): Promise<TagInterpretationResult>;
}
