import { RunningJob, RunningJobsDatabase } from '../maestro-api/RunningJobsDatabase';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryRunningJobsDatabase implements RunningJobsDatabase {
  readonly db = new Map<string, RunningJob>();

  constructor() {
    console.log(`hey i exist: ${Date.now()}`);
  }

  set(key: string, runningJob: RunningJob) {
    this.db.set(key, runningJob);
    return Promise.resolve();
  }

  get(key: string) {
    this.cleanupOldDataIfNecessary();
    return Promise.resolve(this.db.get(key));
  }

  getAll(){
    console.log("db: "+[...this.db.values()] );// TODO remove

    return Promise.resolve([...this.db.values()]);
  }

  getAllForSession(sessionId: string | null) {
    this.cleanupOldDataIfNecessary();
    const res :RunningJob[] = [];
    for (const [key, val] of this.db){
      if(val.sessionId === sessionId){
        res.push(val);
      }
    }
    return Promise.resolve(res);
  }

  cleanupOldDataIfNecessary(){
    for (const [key, val] of this.db){
      if (val.isExpired()){
        this.db.delete(key);
      }
    }
  }
}
