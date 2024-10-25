import express, { Express } from "express";
import * as path from "node:path";
import http from "http";
import { CreateTrack } from './CreateTrack';
import { InMemoryDatabase } from '../infrastructure/InMemoryDatabase';

let createTrack: CreateTrack;

let server: http.Server;
const app: Express = express();
const port = 3003;

beforeAll(() => {
  createTrack = new CreateTrack(new InMemoryDatabase());

  app.use("/public", express.static(path.join(__dirname, "../../assets")));
  server = app.listen(port, () => {
    console.log(
      `[server]: Server serving static files is running at http://localhost:${port}`
    );
  });
});
describe("CreateTrack API", () => {
  it("should return the created track", async () => {
    const res = await createTrack.createTrack({
      url: `http://localhost:${port}/public/light-switch-sound-198508.mp3`,
    });
    expect(res.name).toEqual(
      `light-switch-sound-198508`
    );
    expect(res.source.origin_url).toEqual(
      `http://localhost:${port}/public/light-switch-sound-198508.mp3`
    );
    expect(res.source.origin_name).toEqual(
      `light-switch-sound-198508`
    );
  });

  it("should estimate the song length", async () => {
    const res = await createTrack.createTrack({
      url: `http://localhost:${port}/public/light-switch-sound-198508.mp3`,
    });
    expect(res.name).toEqual(
      `light-switch-sound-198508`
    );
    expect(res.duration).toEqual(
        1.488
    );
  });

  it("should fail when file is not reachable", async () => {
    await expect(
      createTrack.createTrack({
        url: `http://localhost:${port}/public/unexisting-file.mp3`,
      })
    ).rejects.toThrow("file not reachable");
  });
});

afterAll(() => {
  server.close();
});
