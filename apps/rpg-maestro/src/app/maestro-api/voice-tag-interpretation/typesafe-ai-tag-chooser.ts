import { Injectable, Logger } from '@nestjs/common';
import { choice, ChoiceCriteria, TypeSafeClient } from '@typesafe-ai/sdk';
import { TagChoice, TagChoiceQuestion, TagChoices, TagChooser } from './tag-chooser';

const PRIMARY_INSTRUCTIONS = [
  'A tabletop RPG game master is speaking to their players while background music plays.',
  'Given what was just said, which music tag best matches the scene that is unfolding?',
].join(' ');

const SECONDARY_INSTRUCTIONS = [
  'A tabletop RPG game master is speaking to their players while background music plays.',
  'Given what was just said, which music tag is the second best match for the scene?',
  'Pick a different tag than the single best one — the runner-up.',
].join(' ');

/**
 * {@link TagChooser} backed by TypeSafe AI's `systemOne`.
 *
 * The tags are handed to the model as the labels of a `choice` question, so the answer is
 * structurally guaranteed to be one of the session's real tags — no free-text parsing, no
 * post-hoc filtering of hallucinated tags. Two questions are asked in a single request so
 * the primary and the secondary tag each come back with their own reported confidence.
 *
 * Credentials come from `TYPESAFE_API_KEY` (and optionally `TYPESAFE_DEFAULT_MODEL`).
 * Without a key the chooser reports itself unconfigured rather than failing at boot, which
 * lets the deployment run the feature's keyword fallback instead.
 */
@Injectable()
export class TypesafeAiTagChooser implements TagChooser {
  readonly name = 'typesafe-ai';
  private readonly logger = new Logger(TypesafeAiTagChooser.name);
  private client: TypeSafeClient | null = null;

  isConfigured(): boolean {
    return (process.env.TYPESAFE_API_KEY ?? '').trim() !== '';
  }

  async choose({ transcript, labels, noneLabel }: TagChoiceQuestion): Promise<TagChoices> {
    const criteria = buildCriteria(labels, noneLabel);
    const { answers, model, usage } = await this.getClient().systemOne({
      state: { game_master_said: transcript },
      questions: {
        primaryTag: choice(PRIMARY_INSTRUCTIONS, criteria),
        secondaryTag: choice(SECONDARY_INSTRUCTIONS, criteria),
      },
    });
    this.logger.debug(
      `interpreted a transcript with ${model} (${usage.input_tokens} in / ${usage.output_tokens} out tokens)`
    );
    return {
      primary: toTagChoice(answers.primaryTag),
      secondary: toTagChoice(answers.secondaryTag),
    };
  }

  /** Built on first use: the key is only required once someone actually uses the feature. */
  private getClient(): TypeSafeClient {
    if (!this.client) {
      this.client = new TypeSafeClient();
    }
    return this.client;
  }
}

/**
 * Turns the labels into `choice` criteria. Session tags are user-authored words with no
 * description to give, so they are offered as-is; only the "nothing fits" label is described,
 * because the model has to know what it means.
 */
function buildCriteria(labels: string[], noneLabel: string): ChoiceCriteria {
  const criteria: ChoiceCriteria = {};
  for (const label of labels) {
    criteria[label] = label === noneLabel ? 'None of the other tags fits what is happening at the table.' : null;
  }
  return criteria;
}

function toTagChoice(answer: { choice: string; confidence: number }): TagChoice {
  return { label: answer.choice, confidence: answer.confidence };
}
