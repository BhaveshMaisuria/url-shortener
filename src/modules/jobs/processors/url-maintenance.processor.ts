import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Job } from 'bullmq';
import { Url } from '../../urls/entities/url.entity';

@Processor('url-maintenance', {
  concurrency: 1,
})
export class UrlMaintenanceProcessor extends WorkerHost {
  private readonly logger = new Logger(UrlMaintenanceProcessor.name);

  constructor(
    @InjectRepository(Url)
    private readonly urlRepository: Repository<Url>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'cleanup-expired':
        await this.cleanupExpiredUrls();
        break;
      case 'warm-cache':
        await this.warmCache();
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async cleanupExpiredUrls(): Promise<void> {
    const result = await this.urlRepository.update(
      {
        isActive: true,
        expiresAt: LessThan(new Date()),
      },
      {
        isActive: false,
      },
    );

    this.logger.log(
      `Cleanup: deactivated ${result.affected || 0} expired URLs`,
    );
  }

  private async warmCache(): Promise<void> {
    const topUrls = await this.urlRepository.find({
      where: { isActive: true },
      order: { clickCount: 'DESC' },
      take: 100,
    });

    let cached = 0;
    for (const url of topUrls) {
      const cacheKey = `url:shortCode:${url.shortCode}`;
      await this.cacheManager.set(cacheKey, JSON.stringify(url), 300000);
      cached++;
    }

    this.logger.log(`Cache warming: pre-loaded ${cached} URLs into Redis`);
  }
}
