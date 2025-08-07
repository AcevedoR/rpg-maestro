# RpgMaestro

RPG Maestro is a a web app to broadcast music to your players during your TTRPG sessions.
It will soon be publicly available, in the mean time, you can request access in our Discord: https://discord.gg/e4cvXZc3bZ


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

