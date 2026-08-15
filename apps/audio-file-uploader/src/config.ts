import * as process from 'node:process';
import { Logger } from '@nestjs/common';

export function checkValidConfig() {
  Logger.log(`Configuration:`);
  let invalidConfErrors: string[] = [];
  invalidConfErrors = [...invalidConfErrors, ...check('process.env.AUTH_ISSUER', process.env.AUTH_ISSUER)];
  invalidConfErrors = [
    ...invalidConfErrors,
    ...checkSecret('process.env.AUDIO_FILE_UPLOADER_SERVICE_TOKEN', process.env.AUDIO_FILE_UPLOADER_SERVICE_TOKEN),
  ];
  if (invalidConfErrors.length > 0) {
    throw Error('Invalid configuration: ' + invalidConfErrors);
  }
}

function check(name: string, value: string): string[] {
  Logger.log(`\t${name}: ${value}`);
  if (!value || value.length < 3) {
    return [`valid ${name} required, it was: ${value}`];
  }
  return [];
}

function checkSecret(name: string, value: string): string[] {
  Logger.log(`\t${name}: ${value ? '<set>' : value}`);
  if (!value || value.length < 3) {
    return [`valid ${name} required`];
  }
  return [];
}
