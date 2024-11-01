# RpgMaestro
# TODO
- load an entire dir, endpoint
- mongodb
- fix track name encoding
- fix "duration": 50717.210999999996

## RPG-maestro server
### manual deploy
```
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
docker build . -t acevedor/rpg-maestro -f apps/rpg-maestro/Dockerfile --platform linux/amd64
docker push acevedor/rpg-maestro
docker run -e -p 3000:3000 rpg-maestro:latest
```


## dev run
```
npm i
nx dev rpg-maestro
nx serve rpg-maestro-ui
```