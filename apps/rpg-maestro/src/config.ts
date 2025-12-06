import * as process from 'node:process';
import { Logger } from '@nestjs/common';

export function checkValidConfig() {
  Logger.log(`Configuration:`);
  let invalidConfErrors: string[] = [];
  invalidConfErrors = [
    ...invalidConfErrors,
    ...check('process.env.DEFAULT_AUDIO_FILE_UPLOADER_API_URL', process.env.DEFAULT_AUDIO_FILE_UPLOADER_API_URL),
  ];
  invalidConfErrors = [
    ...invalidConfErrors,
    ...check('process.env.DEFAULT_FRONTEND_DOMAIN', process.env.DEFAULT_FRONTEND_DOMAIN),
  ];
  invalidConfErrors = [...invalidConfErrors, ...check('process.env.AUTH_ISSUER', process.env.AUTH_ISSUER)];
  invalidConfErrors = [...invalidConfErrors, ...check('process.env.AUTH_JWT_AUDIENCE', process.env.AUTH_JWT_AUDIENCE)];
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