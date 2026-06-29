import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { UrlAnalytics } from '../../analytics/entities/url-analytics.entity';
import { TrackClickJobData } from '../producers/analytics.producer';

@Processor('analytics', {
  concurrency: 5,
})
export class AnalyticsProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsProcessor.name);

  constructor(
    @InjectRepository(UrlAnalytics)
    private readonly analyticsRepository: Repository<UrlAnalytics>,
  ) {
    super();
  }

  async process(job: Job<TrackClickJobData>): Promise<void> {
    this.logger.debug(`Processing click tracking job ${job.id}`);

    try {
      await this.analyticsRepository.insert({
        urlId: job.data.urlId,
        ipAddress: job.data.ipAddress,
        userAgent: job.data.userAgent,
        referer: job.data.referer,
      });

      this.logger.debug(`Click tracked for URL ${job.data.urlId}`);
    } catch (error) {
      this.logger.error(
        `Failed to track click for URL ${job.data.urlId}:`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }
}
