import { Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import {
  InterpretedTagCandidate,
  InterpretTranscriptTagsRequest,
  InterpretTranscriptTagsResponse,
  Tag,
  VoiceInterpretationConfig,
} from '@rpg-maestro/rpg-maestro-api-contract';
import { TagChoice, TAG_CHOOSER, TagChooser } from './tag-chooser';

/** Confidence a candidate tag must reach before we act on it. */
export const DEFAULT_CONFIDENCE_THRESHOLD = 0.6;

/** Label offered to the model so it can answer "nothing here fits" instead of guessing. */
const NONE_LABEL = 'no_matching_tag';

/**
 * Turns what the game master said into the tags to play.
 *
 * The model is asked for a primary and a secondary tag; each answer carries its own
 * confidence, and a tag is only played when its confidence reaches the threshold. So a
 * confident secondary still counts even when the primary is a coin flip, and a transcript
 * the model cannot read yields no tags at all rather than a random one.
 */
@Injectable()
export class VoiceTagInterpretationService {
  private readonly logger = new Logger(VoiceTagInterpretationService.name);

  constructor(@Inject(TAG_CHOOSER) private readonly tagChooser: TagChooser) {}

  /** Whether the configured chooser can run — the controller turns this into a 503. */
  isAvailable(): boolean {
    return this.tagChooser.isConfigured();
  }

  /**
   * What this server will do with a transcript. Clients show it so nobody has to guess whether
   * the AI or the local keyword fallback is answering — the two are indistinguishable otherwise.
   */
  getConfig(): VoiceInterpretationConfig {
    return {
      provider: this.tagChooser.name,
      isAvailable: this.isAvailable(),
      model: this.tagChooser.configuredModel(),
      confidenceThreshold: getConfidenceThreshold(),
    };
  }

  async interpret({
    transcript,
    availableTags,
  }: InterpretTranscriptTagsRequest): Promise<InterpretTranscriptTagsResponse> {
    if (!this.isAvailable()) {
      throw new ServiceUnavailableException('AI tag interpretation is not configured on this server');
    }
    const confidenceThreshold = getConfidenceThreshold();
    const vocabulary = dedupeTags(availableTags);
    const noneLabel = resolveNoneLabel(vocabulary);

    const { primary, secondary } = await this.tagChooser.choose({
      transcript,
      labels: [...vocabulary, noneLabel],
      noneLabel,
    });

    const primaryCandidate = toCandidate(primary, vocabulary, noneLabel, confidenceThreshold);
    const secondaryCandidate = toCandidate(secondary, vocabulary, noneLabel, confidenceThreshold);

    const tags: Tag[] = [];
    for (const candidate of [primaryCandidate, secondaryCandidate]) {
      if (candidate?.isConfident && !tags.includes(candidate.tag)) {
        tags.push(candidate.tag);
      }
    }

    this.logger.log(
      `interpreted "${transcript}" as ${describe(primaryCandidate)} / ${describe(secondaryCandidate)} ` +
        `(threshold ${confidenceThreshold}) -> [${tags.join(', ')}]`
    );
    return {
      tags,
      primary: primaryCandidate,
      secondary: secondaryCandidate,
      confidenceThreshold,
      provider: this.tagChooser.name,
    };
  }
}

/**
 * Maps one model answer back onto a session tag. Answers are labels we offered, so the
 * only two other outcomes are the "nothing fits" label and — defensively — a label we
 * never sent, which is dropped rather than played.
 */
function toCandidate(
  choice: TagChoice,
  vocabulary: Tag[],
  noneLabel: string,
  confidenceThreshold: number
): InterpretedTagCandidate | null {
  if (choice.label === noneLabel) {
    return null;
  }
  const tag = vocabulary.find((candidate) => candidate === choice.label);
  if (tag === undefined) {
    return null;
  }
  return {
    tag,
    confidence: choice.confidence,
    isConfident: choice.confidence >= confidenceThreshold,
  };
}

/** Keeps the first spelling of each tag; duplicate labels would make the answer ambiguous. */
function dedupeTags(tags: Tag[]): Tag[] {
  return [...new Set(tags)];
}

/**
 * Session tags are user-authored, so the "nothing fits" label could collide with a real one.
 * Suffix it until it is unique, otherwise a legitimate tag would be read as an abstention.
 */
function resolveNoneLabel(vocabulary: Tag[]): string {
  let label = NONE_LABEL;
  while (vocabulary.includes(label)) {
    label = `_${label}_`;
  }
  return label;
}

/**
 * Reads `TYPESAFE_TAG_CONFIDENCE_THRESHOLD`, falling back to
 * {@link DEFAULT_CONFIDENCE_THRESHOLD} when unset or not a probability.
 */
function getConfidenceThreshold(): number {
  const raw = process.env.TYPESAFE_TAG_CONFIDENCE_THRESHOLD;
  if (raw === undefined || raw.trim() === '') {
    return DEFAULT_CONFIDENCE_THRESHOLD;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    new Logger(VoiceTagInterpretationService.name).warn(
      `ignoring invalid TYPESAFE_TAG_CONFIDENCE_THRESHOLD="${raw}", using ${DEFAULT_CONFIDENCE_THRESHOLD}`
    );
    return DEFAULT_CONFIDENCE_THRESHOLD;
  }
  return parsed;
}

function describe(candidate: InterpretedTagCandidate | null): string {
  return candidate === null ? 'none' : `${candidate.tag}@${candidate.confidence.toFixed(2)}`;
}
