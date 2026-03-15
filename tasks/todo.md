- [x] Run test suite requested by user
- [x] Create new branch from main
- [ ] Push branch and open PR

## Review

- apps/rpg-maestro/.env.production is only loaded via the `rpg-maestro:dev` target configuration in `apps/rpg-maestro/project.json` (Nx run-commands `envFile`). It is not referenced by `serve`, `build`, or Docker runtime.
- Values in `.env.production` map to runtime `process.env` checks, but `AUTH_JWT_AUDIENCvE` is a typo vs `AUTH_JWT_AUDIENCE` and will not satisfy `checkValidConfig()` if relying on this file.
- Current production path appears to be Docker/host-provided environment variables rather than Nx envFile.
- apps/rpg-maestro/.env.development is loaded by `nx run rpg-maestro:dev` (logs show env values and `starting app in env: dev or dev`), and it drives runtime config checks in `apps/rpg-maestro/src/config.ts`.
- The `dev` run still fails `wait-on http://localhost:${PORT}/health` because the `${PORT}` placeholder is expanded before envFile injection; runtime uses PORT=3000 fine, but the wait-on command sees an empty PORT.
- apps/rpg-maestro/.env.e2e-tests is loaded by `nx run rpg-maestro:dev-e2e --configuration=e2e-tests` (logs show env values and `starting app in env: e2e-tests or e2e-tests`). It drives runtime config checks and binds to PORT=8099.
- The `dev-e2e` run kept the server running; the command timed out due to long-running serve, not env loading.
- apps/rpg-maestro-ui/.env.development is loaded by Vite when running in development mode; building with `npx nx run rpg-maestro-ui:build -- --mode development` injected `VITE_RPG_MAESTRO_API_URL` and `VITE_AUDIO_FILE_UPLOADER_API_URL` into `dist/apps/rpg-maestro-ui/assets/*.js`.
- apps/rpg-maestro-ui/.env.production is loaded by Vite in production mode; building with `npx nx run rpg-maestro-ui:build -- --mode production` injected Auth0 and API URLs into `dist/apps/rpg-maestro-ui/assets/*.js`.
- apps/rpg-maestro-ui/.env.preview is loaded by Vite in preview mode; building with `npx nx run rpg-maestro-ui:build -- --mode preview` injected the preprod API URLs into `dist/apps/rpg-maestro-ui/assets/*.js` (Auth0 vars are unset in that mode).
- apps/rpg-maestro-ui/.env.e2e-tests is loaded by Vite in e2e-tests mode; building with `npx nx run rpg-maestro-ui:build -- --mode e2e-tests` injected the localhost URLs. Vite warns that `NODE_ENV=e2e-tests` is unsupported in env files but it does not block loading.
- apps/audio-file-uploader/.env.dev is not referenced by Nx targets or dotenv/config in source; runtime reads `process.env` directly. The file is unused and was deleted.

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
- Added a post-login user fetch in `apps/rpg-maestro-ui/src/app/app.tsx` so first-time users trigger onboarding checks after Auth0 login.
- Updated NOT_YET_ONBOARDED redirects to `/onboarding/setup-session` and adjusted tests in `apps/rpg-maestro-ui/src/app/utils/authenticated-fetch.spec.ts`.
- Added a test in `apps/rpg-maestro-ui/src/app/app.spec.tsx` to ensure authenticated sessions fetch the user.

- [x] Investigate first-time login redirect flow in rpg-maestro-ui (prod path)
- [x] Identify mismatch between expected onboarding redirect and current behavior
- [x] Implement fix and add/adjust tests in UI
- [x] Record findings and outcome in Review section

- [x] Plan: add post-login onboarding check in App
- [x] Update NOT_YET_ONBOARDED redirect target
- [x] Adjust UI tests for onboarding redirect
- [x] Run UI test suite
- [x] Record findings in Review section
