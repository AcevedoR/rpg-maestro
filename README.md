# RpgMaestro
## TODO
- Youtube to mp3
  - make a script that do conversion on my server and put it in correct directory ✅
  - upload on fourgate.cloud.private by default <--- figure out a way to either:
    - have a private url for my own usage, only available in France && make the public one available to all && disable track uploading <-- demo version ?
    - secure mp3 files behind auth
      - crossOrigin={'use-credentials'} ?
      - or add a token in url
  - for now, add them to default session via API
  - auto create the track in RPG maestro shared db <- this is not possible yet, might want to think about that.. like a catalogue ?
- demo env vs my personal use !
  - a quick hack could be to have a real demo env.. with no users feat for now 
  - this will be done by implementing Maestro User auth feature
    - there could be 2 two of users: Maestro and AdminMaestro
      - a Maestro can only use existing tracks
      - an AdminMaestro can upload tracks, and already have free TrackCatalogs loaded
    - reminder: set a random Current song for every new sessions !
  - I need to think about Maestros enrollment
  - then they have their own Admin userspace, and can share a public Session link (one maestro = one session)
    - no need to secure the session links for now
- soundboard
- quick tags
- fix some tracks have unhandled "durations", example: 50717.210999999996 (this will probably negatively impact calculus and sync)
- add a local Redis (or equivalent) !
- create a CI/CD
    - handle multienv (prod vs preprod-rpg-maestro.fourgate.cloud)
- replace docker-build and deploy tasks by a custom executor

## run tests
```
npx nx affected -t lint test e2e build --no-cloud
```
## run e2e tests
```
npx nx e2e rpg-maestro-ui-e2e --ui --no-cloud
```

## dev run
```
npm i
nx dev rpg-maestro
nx serve rpg-maestro-ui
```

## RPG-maestro server manual deploy
```
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
docker build . -t acevedor/rpg-maestro -f apps/rpg-maestro/Dockerfile --platform linux/amd64
docker push acevedor/rpg-maestro
docker run -e -p 3000:3000 rpg-maestro:latest
```
