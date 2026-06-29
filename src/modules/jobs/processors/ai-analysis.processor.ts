import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AiService } from '../../ai/ai.service';
import { AiAnalysisJobData } from '../producers/ai-analysis.producer';

@Processor('ai-analysis', {
  concurrency: 2,
})
export class AiAnalysisProcessor extends WorkerHost {
  private readonly logger = new Logger(AiAnalysisProcessor.name);

  constructor(private readonly aiService: AiService) {
    super();
  }

  async process(job: Job<AiAnalysisJobData>): Promise<void> {
    this.logger.log(
      `Processing AI analysis job ${job.id} for URL: ${job.data.originalUrl}`,
    );

    try {
      const metadata = await this.aiService.analyzeUrl(
        job.data.urlId,
        job.data.originalUrl,
      );

      this.logger.log(
        `AI analysis complete for ${job.data.originalUrl}: ` +
          `category=${metadata.category}, tags=[${metadata.tags.join(', ')}]`,
      );
    } catch (error) {
      this.logger.error(
        `AI analysis failed for ${job.data.originalUrl}: ` +
          `${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }
}
