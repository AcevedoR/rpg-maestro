/**
 * What the server is actually configured to do, for clients that need to say so out loud.
 *
 * The voice feature degrades silently — with no AI credentials the interpreter falls back to
 * local keyword matching and still picks tracks — so from the UI alone there is no way to tell
 * which one answered. This is how the UI finds out.
 */
export interface VoiceInterpretationConfig {
  /** Identifier of the interpreter that will answer, e.g. `typesafe-ai`. */
  provider: string;
  /** False when the server lacks credentials for {@link provider}; clients then fall back locally. */
  isAvailable: boolean;
  /** Model the provider is configured to ask, or null when it uses the provider's own default. */
  model: string | null;
  /** Confidence a candidate tag must reach before the server acts on it. */
  confidenceThreshold: number;
}

export interface ClientConfig {
  voiceInterpretation: VoiceInterpretationConfig;
}
