import { DWNClient } from '@extrimian/dwn-client';
import { schedule as scheduleTask, ScheduledTask } from 'node-cron';

export class DWNClientScheduler {
  private readonly scheduledTask : ScheduledTask;

  constructor( dwnClient : DWNClient, cronExpression : string ) {
    this.scheduledTask = scheduleTask(
      cronExpression,
      () => dwnClient.pullNewMessages(),
      {
        scheduled: false,
      }
    );
  }

  start() : void {
    this.scheduledTask.start();
  }

  stop() : void {
    this.scheduledTask.stop();
  }
}
