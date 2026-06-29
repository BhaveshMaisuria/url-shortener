import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UrlAnalytics } from '../analytics/entities/url-analytics.entity';
import { Url } from '../urls/entities/url.entity';
import { AnalyticsProcessor } from './processors/analytics.processor';
import { AnalyticsProducer } from './producers/analytics.producer';
import { UrlMaintenanceProcessor } from './processors/url-maintenance.processor';
import { UrlMaintenanceProducer } from './producers/url-maintenance.producer';
import { AiAnalysisProcessor } from './processors/ai-analysis.processor';
import { AiAnalysisProducer } from './producers/ai-analysis.producer';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    AiModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
        },
      }),
    }),

    BullModule.registerQueue(
      { name: 'analytics' },
      { name: 'url-maintenance' },
      { name: 'ai-analysis' },
    ),
    TypeOrmModule.forFeature([UrlAnalytics, Url]),
  ],
  providers: [
    AnalyticsProcessor,
    UrlMaintenanceProcessor,
    AnalyticsProducer,
    UrlMaintenanceProducer,
    AiAnalysisProcessor,
    AiAnalysisProducer,
  ],
  exports: [AnalyticsProducer, UrlMaintenanceProducer, AiAnalysisProducer],
})
export class JobsModule {}
