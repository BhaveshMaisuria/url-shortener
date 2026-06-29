import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface TrackClickJobData {
  urlId: string;
  ipAddress: string | null;
  userAgent: string | null;
  referer: string | null;
}

@Injectable()
export class AnalyticsProducer {
  constructor(
    @InjectQueue('analytics') private readonly analyticsQueue: Queue,
  ) {}

  async trackClick(data: TrackClickJobData): Promise<void> {
    await this.analyticsQueue.add('track-click', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: {
        age: 3600,
      },
      removeOnFail: {
        age: 86400,
      },
    });
  }
}
