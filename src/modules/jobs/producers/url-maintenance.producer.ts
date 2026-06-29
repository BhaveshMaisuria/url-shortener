import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class UrlMaintenanceProducer implements OnModuleInit {
  private readonly logger = new Logger(UrlMaintenanceProducer.name);

  constructor(
    @InjectQueue('url-maintenance')
    private readonly maintenanceQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    const existingSchedulers = await this.maintenanceQueue.getJobSchedulers();
    for (const scheduler of existingSchedulers) {
      if (scheduler.id) {
        await this.maintenanceQueue.removeJobScheduler(scheduler.id);
      }
    }
    await this.maintenanceQueue.add(
      'cleanup-expired',
      {},
      {
        repeat: {
          pattern: '0 2 * * *',
        },
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 50 },
      },
    );
    this.logger.log('Scheduled: cleanup-expired (daily at 2 AM)');

    await this.maintenanceQueue.add(
      'warm-cache',
      {},
      {
        repeat: {
          pattern: '0 * * * *',
        },
        removeOnComplete: { count: 5 },
        removeOnFail: { count: 20 },
      },
    );
    this.logger.log('Scheduled: warm-cache (every hour)');
  }
}
