import { Tag } from '@rpg-maestro/rpg-maestro-api-contract';
import {
  TagInterpretationInput,
  TagInterpretationProvider,
  TagInterpretationResult,
} from './tag-interpretation-provider';

/**
 * Maps a canonical mood/scene tag to the spoken keywords that should trigger it.
 * Keys mirror the quick-tags used elsewhere in the soundboard (combat, settlement,
 * forest, travel, dungeon) plus a few extras. Multi-word keywords are matched as
 * whole phrases; single-word keywords are matched on word boundaries.
 */
export const DEFAULT_TAG_PATTERNS: Record<string, string[]> = {
  combat: [
    'sword',
    'bow',
    'arrow',
    'attack',
    'fight',
    'fighting',
    'battle',
    'enemy',
    'enemies',
    'goblin',
    'orc',
    'dragon',
    'initiative',
    'hit',
    'strike',
    'slay',
    'ambush',
    'duel',
  ],
  settlement: ['town', 'village', 'city', 'market', 'shop', 'merchant', 'street', 'gate', 'citizen'],
  tavern: ['tavern', 'inn', 'ale', 'drink', 'bard', 'feast', 'barkeep'],
  forest: ['forest', 'woods', 'wood', 'tree', 'trees', 'jungle', 'grove', 'wilderness'],
  travel: ['travel', 'journey', 'road', 'path', 'walk', 'march', 'ride', 'horse', 'wagon', 'trek'],
  dungeon: ['dungeon', 'cave', 'crypt', 'tomb', 'catacomb', 'underground', 'ruins', 'cellar', 'labyrinth'],
  mystery: ['mystery', 'clue', 'investigate', 'secret', 'riddle', 'puzzle', 'strange'],
};

/**
 * Deterministic, LLM-free interpreter. It looks for known keywords in the transcript
 * to derive canonical mood tags, then intersects the result with the session's actual
 * available tags so only real, playable tags are ever returned. It also matches when
 * the transcript literally mentions an available tag by name.
 *
 * This is the first-iteration stand-in for a real LLM provider; it deliberately shares
 * the {@link TagInterpretationProvider} contract so it can be swapped out transparently.
 */
export class PatternMatchingInterpretationProvider implements TagInterpretationProvider {
  readonly name = 'pattern-matching';

  constructor(private readonly patterns: Record<string, string[]> = DEFAULT_TAG_PATTERNS) {}

  interpret({ transcript, availableTags }: TagInterpretationInput): Promise<TagInterpretationResult> {
    const normalized = normalizeForMatching(transcript);
    const availableByLower = new Map<string, Tag>();
    for (const tag of availableTags) {
      availableByLower.set(tag.toLowerCase(), tag);
    }

    const matched = new Set<Tag>();

    // 1. Canonical mood tags derived from keyword patterns.
    for (const [canonicalTag, keywords] of Object.entries(this.patterns)) {
      const availableTag = availableByLower.get(canonicalTag.toLowerCase());
      if (!availableTag) {
        continue; // this session has no such tag — skip it
      }
      if (keywords.some((keyword) => phraseAppears(normalized, keyword))) {
        matched.add(availableTag);
      }
    }

    // 2. Any available tag whose own name is spoken in the transcript.
    for (const [lowerTag, tag] of availableByLower) {
      if (phraseAppears(normalized, lowerTag)) {
        matched.add(tag);
      }
    }

    return Promise.resolve({ tags: [...matched], provider: this.name });
  }
}

/** Lower-cases, strips punctuation, and pads with spaces so phrase lookups are simple. */
function normalizeForMatching(text: string): string {
  const cleaned = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return ` ${cleaned} `;
}

/** True if `phrase` appears as a whole word / phrase in the already-normalized text. */
function phraseAppears(normalizedText: string, phrase: string): boolean {
  const normalizedPhrase = phrase.toLowerCase().replace(/\s+/g, ' ').trim();
  if (normalizedPhrase === '') {
    return false;
  }
  return normalizedText.includes(` ${normalizedPhrase} `);
}
