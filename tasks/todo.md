- [x] Plan: inventory config files starting with apps/rpg-maestro/.env.production
- [x] Verify how NestJS/Nx loads .env.production in this project
- [x] Document whether entries are used, unused, or misconfigured
- [x] Record findings and next checks in Review section

## Review

- apps/rpg-maestro/.env.production is only loaded via the `rpg-maestro:dev` target configuration in `apps/rpg-maestro/project.json` (Nx run-commands `envFile`). It is not referenced by `serve`, `build`, or Docker runtime.
- Values in `.env.production` map to runtime `process.env` checks, but `AUTH_JWT_AUDIENCvE` is a typo vs `AUTH_JWT_AUDIENCE` and will not satisfy `checkValidConfig()` if relying on this file.
- Current production path appears to be Docker/host-provided environment variables rather than Nx envFile.

- [x] Plan: scan UI and backend auth flows for guard/token/claims usage
- [x] Inspect Auth0 configuration, token validation, and role checks for anomalies
- [x] Add tests for any suspicious behavior or edge cases found
- [x] Record findings and test coverage in Review section

## Review

- `apps/rpg-maestro/src/app/auth/jwt-helper.ts` uses `jwtVerify` without issuer/audience options, so tokens signed by the JWKS are accepted regardless of `AUTH_JWT_AUDIENCE`/issuer.
- Added a unit test in `apps/rpg-maestro/src/app/auth/jwt-auth.guard.spec.ts` confirming that a token with an unexpected audience/issuer still decodes.

- [x] Plan: review rpg-maestro-ui auth initialization and fetch wrapper flows
- [x] Identify any UI auth anomalies or edge cases
- [x] Add UI tests to confirm any suspicious behavior
- [x] Record findings for UI auth in Review section

## Review

- `apps/rpg-maestro-ui/src/app/utils/authenticated-fetch.ts` clears session storage on 401 but does not redirect, while 403 triggers redirects; added tests to lock in this behavior along with onboarding redirects.
- Added unit tests in `apps/rpg-maestro-ui/src/app/utils/authenticated-fetch.spec.ts` for bearer header injection, 403 redirect, NOT_YET_ONBOARDED redirect, and 401 no-redirect.
- Updated `apps/rpg-maestro-ui/src/app/utils/authenticated-fetch.ts` to redirect to `/login` on 401 and adjusted tests in `apps/rpg-maestro-ui/src/app/utils/authenticated-fetch.spec.ts` accordingly.
