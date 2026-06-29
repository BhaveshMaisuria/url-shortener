import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UrlAiMetadata } from './entities/url-ai-metadata.entity';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { Url } from '../urls/entities/url.entity';
import { GeminiService } from './gemini.service';
import { WebpageFetcherService } from './webpage-fetcher.service';

@Module({
  imports: [TypeOrmModule.forFeature([UrlAiMetadata, Url])],
  controllers: [AiController],
  providers: [AiService, GeminiService, WebpageFetcherService],
  exports: [AiService],
})
export class AiModule {}
