/**
 * Port between the voice feature and whichever model actually ranks the tags.
 *
 * The service owns the vocabulary, the "nothing fits" escape hatch and the confidence
 * gating; an implementation only has to answer, for one transcript, which label comes
 * first, which comes second, and how confident it is in each. Keeping it this narrow
 * means the service is testable without any network access, and a second backend could
 * be dropped in without touching the feature logic.
 */

export interface TagChoiceQuestion {
  /** What the game master said.  */
  transcript: string;
  /** The labels the answer must be picked from — the session tags plus {@link noneLabel}. */
  labels: string[];
  /** The label meaning "none of these tags fit". Always a member of {@link labels}. */
  noneLabel: string;
}

export interface TagChoice {
  /** One of the labels that was offered. */
  label: string;
  /** Confidence reported for that label, from 0 to 1. */
  confidence: number;
}

export interface TagChoices {
  primary: TagChoice;
  secondary: TagChoice;
}

export interface TagChooser {
  /** Stable identifier, surfaced to the client as the provider name. */
  readonly name: string;
  /** Whether the chooser has everything it needs to run (credentials, etc.). */
  isConfigured(): boolean;
  /**
   * Model this chooser is configured to ask, or null when it leaves the choice to the
   * provider's own default. Reported to clients so an operator can see what is answering.
   */
  configuredModel(): string | null;
  /** Rank the labels for one transcript, best and second best. */
  choose(question: TagChoiceQuestion): Promise<TagChoices>;
}

/** DI token — `TagChooser` is an interface, so it cannot be one itself. */
export const TAG_CHOOSER = 'TagChooser';
