import { InterpretTranscriptTagsRequest } from '@rpg-maestro/rpg-maestro-api-contract';
import { DEFAULT_CONFIDENCE_THRESHOLD, VoiceTagInterpretationService } from './voice-tag-interpretation.service';
import { TagChoiceQuestion, TagChoices, TagChooser } from './tag-chooser';

class FakeTagChooser implements TagChooser {
  readonly name = 'fake';
  lastQuestion: TagChoiceQuestion | null = null;
  configured = true;

  constructor(private readonly answers: TagChoices) {}

  isConfigured(): boolean {
    return this.configured;
  }

  choose(question: TagChoiceQuestion): Promise<TagChoices> {
    this.lastQuestion = question;
    return Promise.resolve(this.answers);
  }
}

const NONE = 'no_matching_tag';
const request = (availableTags: string[] = ['combat', 'forest', 'tavern']): InterpretTranscriptTagsRequest =>
  new InterpretTranscriptTagsRequest('The orcs charge out of the trees!', availableTags);

describe('VoiceTagInterpretationService', () => {
  afterEach(() => {
    delete process.env.TYPESAFE_TAG_CONFIDENCE_THRESHOLD;
  });

  it('plays both tags when both are confident, primary first', async () => {
    const chooser = new FakeTagChooser({
      primary: { label: 'combat', confidence: 0.91 },
      secondary: { label: 'forest', confidence: 0.72 },
    });

    const result = await new VoiceTagInterpretationService(chooser).interpret(request());

    expect(result.tags).toEqual(['combat', 'forest']);
    expect(result.primary).toEqual({ tag: 'combat', confidence: 0.91, isConfident: true });
    expect(result.secondary).toEqual({ tag: 'forest', confidence: 0.72, isConfident: true });
    expect(result.provider).toBe('fake');
    expect(result.confidenceThreshold).toBe(DEFAULT_CONFIDENCE_THRESHOLD);
  });

  it('plays the secondary tag alone when only it is confident', async () => {
    const chooser = new FakeTagChooser({
      primary: { label: 'combat', confidence: 0.31 },
      secondary: { label: 'forest', confidence: 0.88 },
    });

    const result = await new VoiceTagInterpretationService(chooser).interpret(request());

    expect(result.tags).toEqual(['forest']);
    expect(result.primary?.isConfident).toBe(false);
  });

  it('plays nothing when neither tag is confident', async () => {
    const chooser = new FakeTagChooser({
      primary: { label: 'combat', confidence: 0.4 },
      secondary: { label: 'forest', confidence: 0.2 },
    });

    const result = await new VoiceTagInterpretationService(chooser).interpret(request());

    expect(result.tags).toEqual([]);
    expect(result.primary?.tag).toBe('combat');
    expect(result.secondary?.tag).toBe('forest');
  });

  it('reports no candidate when the model answers that nothing fits', async () => {
    const chooser = new FakeTagChooser({
      primary: { label: NONE, confidence: 0.99 },
      secondary: { label: NONE, confidence: 0.95 },
    });

    const result = await new VoiceTagInterpretationService(chooser).interpret(request());

    expect(result.tags).toEqual([]);
    expect(result.primary).toBeNull();
    expect(result.secondary).toBeNull();
  });

  it('offers the session tags plus a "nothing fits" label to the chooser', async () => {
    const chooser = new FakeTagChooser({
      primary: { label: 'combat', confidence: 0.9 },
      secondary: { label: NONE, confidence: 0.9 },
    });

    await new VoiceTagInterpretationService(chooser).interpret(request(['combat', 'combat', 'forest']));

    expect(chooser.lastQuestion?.labels).toEqual(['combat', 'forest', NONE]);
    expect(chooser.lastQuestion?.noneLabel).toBe(NONE);
  });

  it('renames the "nothing fits" label when a session tag already uses it', async () => {
    const chooser = new FakeTagChooser({
      primary: { label: NONE, confidence: 0.9 },
      secondary: { label: `_${NONE}_`, confidence: 0.9 },
    });

    const result = await new VoiceTagInterpretationService(chooser).interpret(request(['combat', NONE]));

    expect(chooser.lastQuestion?.noneLabel).toBe(`_${NONE}_`);
    // the real tag named like the sentinel stays playable...
    expect(result.primary).toEqual({ tag: NONE, confidence: 0.9, isConfident: true });
    // ...while the renamed sentinel still means "nothing fits"
    expect(result.secondary).toBeNull();
  });

  it('does not play the same tag twice when both answers agree', async () => {
    const chooser = new FakeTagChooser({
      primary: { label: 'combat', confidence: 0.9 },
      secondary: { label: 'combat', confidence: 0.8 },
    });

    const result = await new VoiceTagInterpretationService(chooser).interpret(request());

    expect(result.tags).toEqual(['combat']);
  });

  it('ignores a label that was never offered', async () => {
    const chooser = new FakeTagChooser({
      primary: { label: 'spaceship', confidence: 0.99 },
      secondary: { label: 'forest', confidence: 0.7 },
    });

    const result = await new VoiceTagInterpretationService(chooser).interpret(request());

    expect(result.primary).toBeNull();
    expect(result.tags).toEqual(['forest']);
  });

  it('honours TYPESAFE_TAG_CONFIDENCE_THRESHOLD', async () => {
    process.env.TYPESAFE_TAG_CONFIDENCE_THRESHOLD = '0.95';
    const chooser = new FakeTagChooser({
      primary: { label: 'combat', confidence: 0.9 },
      secondary: { label: 'forest', confidence: 0.96 },
    });

    const result = await new VoiceTagInterpretationService(chooser).interpret(request());

    expect(result.confidenceThreshold).toBe(0.95);
    expect(result.tags).toEqual(['forest']);
  });

  it('falls back to the default threshold when the env value is not a probability', async () => {
    process.env.TYPESAFE_TAG_CONFIDENCE_THRESHOLD = 'very sure';
    const chooser = new FakeTagChooser({
      primary: { label: 'combat', confidence: 0.7 },
      secondary: { label: NONE, confidence: 0.9 },
    });

    const result = await new VoiceTagInterpretationService(chooser).interpret(request());

    expect(result.confidenceThreshold).toBe(DEFAULT_CONFIDENCE_THRESHOLD);
    expect(result.tags).toEqual(['combat']);
  });

  it('refuses to interpret when the chooser is not configured', async () => {
    const chooser = new FakeTagChooser({
      primary: { label: 'combat', confidence: 0.9 },
      secondary: { label: NONE, confidence: 0.9 },
    });
    chooser.configured = false;
    const service = new VoiceTagInterpretationService(chooser);

    expect(service.isAvailable()).toBe(false);
    await expect(service.interpret(request())).rejects.toThrow('not configured');
  });
});
