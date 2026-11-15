#!/usr/bin/env bash
# Builds or pushes the Docker image of an app, for the version semantic-release tagged at HEAD.
#
#   devtools/release/docker-release.sh build <project> [extra docker build args...]
#   devtools/release/docker-release.sh push  <project>
#
# The version comes from the project's git tag on HEAD (`<project>-v<version>`), not from a file
# written during the semantic-release run. semantic-release pushes the tag before its last step
# (pushing refs/notes/semantic-release), and that last step can fail — GitHub sometimes rejects
# the notes ref when several apps release seconds apart. Reading the tag makes a re-run finish the
# release: semantic-release sees the tag and skips, and this script still builds and pushes it.
#
# No tag on HEAD means no release for this project: skip. Any docker failure fails the task.
set -euo pipefail

action="${1:?usage: docker-release.sh build|push <project> [docker build args...]}"
project="${2:?missing project name}"
shift 2

# `<project>-v[0-9]*` so that rpg-maestro does not match rpg-maestro-ui tags
version="$(git tag --points-at HEAD --list "${project}-v[0-9]*" | sed "s/^${project}-v//" | sort -V | tail -n 1)"

if [ -z "$version" ]; then
  echo "no ${project} release tag on HEAD, skipping ${action}"
  exit 0
fi

image="acevedor/${project}"
case "$action" in
  build)
    echo "building ${image}:${version}"
    docker build . -f "./apps/${project}/Dockerfile" \
      -t "${image}:${version}" -t "${image}:latest" \
      --platform linux/amd64 \
      --build-arg "APP_VERSION=${version}" \
      --build-arg "BUILD_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
      "$@"
    ;;
  push)
    echo "pushing ${image}:${version} and :latest"
    docker push "${image}:${version}"
    docker push "${image}:latest"
    ;;
  *)
    echo "unknown action: ${action}" >&2
    exit 1
    ;;
esac
