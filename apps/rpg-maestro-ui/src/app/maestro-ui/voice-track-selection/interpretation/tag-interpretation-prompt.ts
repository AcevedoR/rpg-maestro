import { Tag } from '@rpg-maestro/rpg-maestro-api-contract';

/**
 * Builds the LLM prompt from the two inputs the feature is specified around:
 * the spoken transcript and the list of tags available in the session.
 *
 * The current first-iteration provider is a deterministic pattern matcher that does
 * not call an LLM, but a future real-LLM provider is expected to send this exact prompt
 * and parse a JSON array of tags back. Keeping the prompt here means the "what we would
 * ask the model" contract lives in one place, independent of any provider.
 */
export function buildTagInterpretationPrompt(transcript: string, availableTags: Tag[]): string {
  return [
    'You are helping a tabletop RPG game master pick background music.',
    'Given a short transcript of what is happening at the table and the list of available music tags,',
    'choose the tags that best match the mood and scene.',
    '',
    'Rules:',
    '- Only return tags from the provided list of available tags.',
    '- Return between 1 and 3 tags, ordered from most to least relevant.',
    '- Respond with a JSON array of strings and nothing else.',
    '',
    `Available tags: ${JSON.stringify(availableTags)}`,
    `Transcript: ${JSON.stringify(transcript)}`,
  ].join('\n');
}
