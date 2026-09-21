import { InterpretedTagCandidate, Tag } from '@rpg-maestro/rpg-maestro-api-contract';

/**
 * Provider-agnostic contract for turning a spoken transcript into a list of track tags
 * to play, given the tags actually available in the current session.
 *
 * The production implementation is {@link TypesafeAiInterpretationProvider}, which asks the
 * backend for a primary and a secondary tag and keeps the ones the model is confident about.
 * {@link PatternMatchingInterpretationProvider} is the LLM-free keyword matcher used as a
 * fallback when the AI interpreter is unavailable.
 */

export interface TagInterpretationInput {
  /** The transcript of what the maestro said. */
  transcript: string;
  /** Every tag that exists across the session's tracks — the allowed output vocabulary. */
  availableTags: Tag[];
  /** Allows the caller to cancel an in-flight interpretation (e.g. on unmount). */
  signal?: AbortSignal;
}

export interface TagInterpretationResult {
  /** Tags to play, all guaranteed to be members of `availableTags`. */
  tags: Tag[];
  /** Name of the provider that produced this result. */
  provider: string;
  /** Best match with its confidence, when the provider reports one. */
  primary?: InterpretedTagCandidate | null;
  /** Runner-up with its confidence, when the provider reports one. */
  secondary?: InterpretedTagCandidate | null;
}

export interface TagInterpretationProvider {
  /** Stable identifier used in logs and results. */
  readonly name: string;
  /** Map a transcript + available tags to the subset of tags that should play. */
  interpret(input: TagInterpretationInput): Promise<TagInterpretationResult>;
}
