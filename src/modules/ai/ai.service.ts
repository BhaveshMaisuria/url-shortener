import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UrlAiMetadata } from './entities/url-ai-metadata.entity';
import { GeminiService } from './gemini.service';
import { WebpageFetcherService } from './webpage-fetcher.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @InjectRepository(UrlAiMetadata)
    private readonly aiMetadataRepository: Repository<UrlAiMetadata>,
    private readonly geminiService: GeminiService,
    private readonly webpageFetcherService: WebpageFetcherService,
  ) {}

  async analyzeUrl(urlId: string, originalUrl: string): Promise<UrlAiMetadata> {
    this.logger.log(`Starting AI analysis for URL: ${originalUrl}`);

    const textContent =
      await this.webpageFetcherService.fetchAndExtract(originalUrl);

    if (!textContent) {
      this.logger.warn(
        `Could not fetch content for ${originalUrl}, using URL only`,
      );
    }

    const contentToAnalyze = textContent || `URL: ${originalUrl}`;
    const analysis = await this.geminiService.analyzeContent(
      originalUrl,
      contentToAnalyze,
    );

    this.logger.log(
      `AI analysis complete: category=${analysis.category}, tags=${analysis.tags.join(', ')}`,
    );

    const existing = await this.aiMetadataRepository.findOne({
      where: { urlId },
    });

    if (existing) {
      existing.summary = analysis.summary;
      existing.tags = analysis.tags;
      existing.category = analysis.category;
      return this.aiMetadataRepository.save(existing);
    }

    const metadata = this.aiMetadataRepository.create({
      urlId,
      summary: analysis.summary,
      tags: analysis.tags,
      category: analysis.category,
    });

    return this.aiMetadataRepository.save(metadata);
  }

  async getMetadataByUrlId(urlId: string): Promise<UrlAiMetadata | null> {
    return this.aiMetadataRepository.findOne({ where: { urlId } });
  }
}
