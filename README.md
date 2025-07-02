# RpgMaestro

## TODO ideas

- Youtube to mp3
    - upload on fourgate.cloud.private by default <--- figure out a way to either:
        - have a private url for my own usage, only available in France && make the public one available to all &&
          disable track uploading <-- demo version ?
        - secure mp3 files behind auth
            - crossOrigin={'use-credentials'} ?
            - or add a token in
              url -> https://github.com/icidasset/diffuse/blob/6837490c25ec5a534fffdeb3abc818dea9386665/src/Javascript/Workers/service.js#L104
- reminder: set a random Current song for every new sessions !
- TODO: think about possibility of having multiple maestro
  - idea: maybe a quick hack would be for the gm to allow for others to modify its session with a simple button
    and then, all Players with the URL can modify it
    I will need to check userId or email vs the sessionOwner
    I could simply add a list of additional Maestro on the session infos !!!!!!
- create a (CI/)CD
    - handle multienv (prod vs preprod-rpg-maestro.fourgate.cloud)

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

