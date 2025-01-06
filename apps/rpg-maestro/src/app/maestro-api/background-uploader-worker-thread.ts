import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { parentPort, workerData } from 'worker_threads';
import { RunningJobsDatabase } from './RunningJobsDatabase';
import { Logger } from '@nestjs/common';

async function run() {
  // const app = await NestFactory.createApplicationContext(AppModule);// FIXME unfortunately this creates another nest application with a different context
  // TODO I need to use https://docs.nestjs.com/techniques/task-scheduling#dynamic-schedule-module-api instead
  // OR
  // I could create a bean BackgroundJobsHandler that can be wake up, loop X minutes listening for changes, and stops <<<<<<<<<<<<<<<<<<<<<<<<<<<<< this is better
  // I will need to check the impact vs the NodeJS Event loop

  const db: {db:any} = workerData;

  // appService.checkMainThread();
  async function sleep(delay): Promise<void> {
    Logger.log(`background-uploader-worker-thread.ts started with data: ${[...db.db.values()]}`);
    console.debug(db)

    return new Promise(function (resolve) {
      setTimeout(() => {
        console.log('This message is logged after 2 seconds');
        resolve();
      }, delay);
    });
  }

  await sleep(2000);
  Logger.log(`background-uploader-worker-thread.ts started with data: ${JSON.stringify(db.db)}`);
  console.debug(db)

  // const res= await db.getAll(); // TODO
  // Logger.log(`all running jobs???: ${res}`);// TODO remove
  parentPort.postMessage("ok");
}

run();
