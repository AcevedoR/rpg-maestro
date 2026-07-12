import { TagInterpretationProvider } from './tag-interpretation-provider';
import { PatternMatchingInterpretationProvider } from './pattern-matching-interpretation-provider';

/**
 * Ordered list of known interpretation providers, most-preferred first.
 * Add future providers (e.g. a real LLM-backed provider) here.
 */
export function getInterpretationProviders(): TagInterpretationProvider[] {
  return [new PatternMatchingInterpretationProvider()];
}

/** Returns the preferred interpretation provider. There is always at least one. */
export function resolveInterpretationProvider(
  providers: TagInterpretationProvider[] = getInterpretationProviders()
): TagInterpretationProvider {
  return providers[0];
}
