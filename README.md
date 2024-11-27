# RpgMaestro
## TODO
- soundboard
- quick tags
- fix some tracks have unhandled "durations", example: 50717.210999999996 (this will probably negatively impact calculus and sync)

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
