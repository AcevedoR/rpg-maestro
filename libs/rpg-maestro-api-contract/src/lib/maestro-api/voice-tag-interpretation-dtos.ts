import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Tag } from '../Tag';

/** Longest transcript the interpreter accepts; a 15s listen is far below this. */
export const MAX_TRANSCRIPT_LENGTH = 2000;
/** Upper bound on the tag vocabulary sent to the model, to keep the request bounded. */
export const MAX_AVAILABLE_TAGS = 200;

/**
 * Asks the backend to turn what the game master said into the tags to play.
 * The backend owns the AI call, so the API key never reaches the browser.
 */
export class InterpretTranscriptTagsRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_TRANSCRIPT_LENGTH)
  transcript: string;

  /** Every tag that exists in the session — the only vocabulary the model may answer with. */
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MAX_AVAILABLE_TAGS)
  @IsString({ each: true })
  availableTags: Tag[];

  // defaulted so `parseAndValidateDto` can instantiate the DTO with a single argument
  constructor(transcript = '', availableTags: Tag[] = []) {
    this.transcript = transcript;
    this.availableTags = availableTags;
  }
}

/** One tag the model proposed, with the confidence it reported for it. */
export interface InterpretedTagCandidate {
  tag: Tag;
  /** Reported confidence, from 0 to 1. */
  confidence: number;
  /** Whether {@link confidence} reached the server-side threshold. */
  isConfident: boolean;
}

export interface InterpretTranscriptTagsResponse {
  /**
   * The tags to actually play: the confident candidates, primary first.
   * Empty when neither candidate cleared the confidence threshold.
   */
  tags: Tag[];
  /** Best match, or null when the model answered that nothing fits. */
  primary: InterpretedTagCandidate | null;
  /** Runner-up, or null when the model answered that nothing else fits. */
  secondary: InterpretedTagCandidate | null;
  /** Confidence a candidate had to reach to make it into {@link tags}. */
  confidenceThreshold: number;
  /** Name of the interpreter that produced this result. */
  provider: string;
}
