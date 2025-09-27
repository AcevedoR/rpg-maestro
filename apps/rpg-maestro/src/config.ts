import * as process from 'node:process';

export function checkValidConfig() {
  const invalidConfErrors: string[] = [];
  const defaultaudiofileuploaderapiurl = process.env.DEFAULT_AUDIO_FILE_UPLOADER_API_URL;
  if (!defaultaudiofileuploaderapiurl || defaultaudiofileuploaderapiurl.length < 3) {
    invalidConfErrors.push('process.env.DEFAULT_AUDIO_FILE_UPLOADER_API_URL required');
  }
  const defaultfrontenddomain = process.env.DEFAULT_FRONTEND_DOMAIN;
  if (!defaultfrontenddomain || defaultfrontenddomain.length < 3) {
    invalidConfErrors.push('process.env.DEFAULT_FRONTEND_DOMAIN required');
  }
  const AUTH_ISSUER = process.env.AUTH_ISSUER;
  if(!AUTH_ISSUER || AUTH_ISSUER.length <3){
    invalidConfErrors.push('AUTH_ISSUER required');
  }
  const AUTH_JWT_AUDIENCE = process.env.AUTH_JWT_AUDIENCE;
  if(!AUTH_JWT_AUDIENCE || AUTH_JWT_AUDIENCE.length < 3){
    invalidConfErrors.push('AUTH_JWT_AUDIENCE required');
  }
  if (invalidConfErrors.length > 0) {
    throw Error('Invalid configuration: ' + invalidConfErrors);
  }
}
