
## urgent
- fix auth:
  - check onboarding nominal path does work
  - add a way to promote a maestro from UI?

## ideas
- Youtube to mp3
  - upload on fourgate.cloud.private by default <--- figure out a way to either:
    - have a private url for my own usage, only available in France && make the public one available to all &&
      disable track uploading <-- demo version ?
    - secure mp3 files behind auth
      - crossOrigin={'use-credentials'} ?
      - or add a token in
        url -> https://github.com/icidasset/diffuse/blob/6837490c25ec5a534fffdeb3abc818dea9386665/src/Javascript/Workers/service.js#L104
- TODO: think about possibility of having multiple maestro
  - idea: maybe a quick hack would be for the gm to allow for others to modify its session with a simple button
    and then, all Players with the URL can modify it
    I will need to check userId or email vs the sessionOwner
