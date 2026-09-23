import { VoiceInterpretationConfig } from '@rpg-maestro/rpg-maestro-api-contract';

/**
 * Human-readable names for the interpreters. Unknown ids are shown as-is rather than hidden:
 * a deployment running something this build has never heard of is exactly the case where an
 * operator most wants to see the raw name.
 */
export const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  'typesafe-ai': 'TypeSafe AI',
  'pattern-matching': 'keyword matching',
};

/** The local fallback the UI uses when the server cannot interpret. */
const FALLBACK_PROVIDER = 'pattern-matching';

export function displayNameOf(provider: string): string {
  return PROVIDER_DISPLAY_NAMES[provider] ?? provider;
}

/**
 * One line naming whatever will actually answer, for the microphone tooltip.
 *
 * When the server reports its provider as unavailable the answer does not come from it at all —
 * the UI falls back to local keyword matching — so this names the fallback instead of the
 * provider that is configured but idle. Returns null when the config could not be read, so the
 * caller can simply say nothing rather than guess.
 */
export function describeInterpretationProvider(config: VoiceInterpretationConfig | null): string | null {
  if (config === null) {
    return null;
  }
  if (!config.isAvailable) {
    return `using ${displayNameOf(FALLBACK_PROVIDER)} — no AI provider configured on the server`;
  }
  const model = config.model === null ? '' : ` (${config.model})`;
  return `using ${displayNameOf(config.provider)}${model}`;
}
