import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface AiAnalysisJobData {
  urlId: string;
  originalUrl: string;
}

@Injectable()
export class AiAnalysisProducer {
  constructor(@InjectQueue('ai-analysis') private readonly aiQueue: Queue) {}

  async analyzeUrl(data: AiAnalysisJobData): Promise<void> {
    await this.aiQueue.add('analyze-url', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 86400 * 7 },
    });
  }
}
