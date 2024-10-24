import { createTrack } from './CreateTrack';
import express, { Express } from 'express';
import * as path from 'node:path';

it('should return the created track', async () => {
  const app: Express = express();
  const port = 3003;
  app.use(express.static(path.join(__dirname, '../../assets')));
  app.listen(port, () => {
    console.log(
      `[server]: Server serving static files is running at http://localhost:${port}`
    );
  });

  const res = createTrack({
    url: `http://localhost:${port}/public/light-switch-sound-198508.mp3`,
  });
  expect(res.source.origin_url).toEqual(
    `http://localhost:${port}/public/light-switch-sound-198508.mp3`
  );
});
// const ress = await fetch(`http://localhost:${port}/public/test.txt`); TODO
