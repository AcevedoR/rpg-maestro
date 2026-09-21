import { Module } from '@nestjs/common';
import { VoiceTagInterpretationService } from './voice-tag-interpretation.service';
import { TAG_CHOOSER } from './tag-chooser';
import { TypesafeAiTagChooser } from './typesafe-ai-tag-chooser';

@Module({
  providers: [VoiceTagInterpretationService, { provide: TAG_CHOOSER, useClass: TypesafeAiTagChooser }],
  exports: [VoiceTagInterpretationService],
})
export class VoiceTagInterpretationModule {}
