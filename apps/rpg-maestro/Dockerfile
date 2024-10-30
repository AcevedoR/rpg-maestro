# syntax=docker/dockerfile:1
FROM node:alpine
RUN apk add  --no-cache ffmpeg

# Use production node environment by default.
ENV NODE_ENV production

WORKDIR /usr/src/app

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.npm to speed up subsequent builds.
# Leverage a bind mounts to package.json and package-lock.json to avoid having to copy them into
# into this layer.
RUN --mount=type=bind,source=./dist/apps/rpg-maestro/package.json,target=package.json \
    --mount=type=bind,source=./dist/apps/rpg-maestro/package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev


# Run the application as a non-root user.
USER node

ENV FFMPEG_PATH="/usr/bin/ffmpeg"
ENV FFPROBE_PATH="/usr/bin/ffprobe"

# Copy the rest of the source files into the image.
COPY ./dist/apps/rpg-maestro/ .

# Expose the port that the application listens on.
EXPOSE 3000

# Run the application.
CMD node main.js
