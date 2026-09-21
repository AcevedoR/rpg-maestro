import { TagInterpretationProvider } from './tag-interpretation-provider';
import { PatternMatchingInterpretationProvider } from './pattern-matching-interpretation-provider';
import { TypesafeAiInterpretationProvider } from './typesafe-ai-interpretation-provider';

/**
 * Ordered list of known interpretation providers, most-preferred first.
 *
 * TypeSafe AI is the real interpreter; the keyword matcher stays as its fallback so the
 * microphone keeps working on a deployment with no AI credentials configured.
 */
export function getInterpretationProviders(): TagInterpretationProvider[] {
  const patternMatching = new PatternMatchingInterpretationProvider();
  return [new TypesafeAiInterpretationProvider({ fallback: patternMatching }), patternMatching];
}

/** Returns the preferred interpretation provider. There is always at least one. */
export function resolveInterpretationProvider(
  providers: TagInterpretationProvider[] = getInterpretationProviders()
): TagInterpretationProvider {
  return providers[0];
}
