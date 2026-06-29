import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Url } from './entities/url.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { UrlResponseDto } from './dto/url-response.dto';
import { CreateUrlDto } from './dto/create-url.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { AiAnalysisProducer } from '../jobs/producers/ai-analysis.producer';

@Injectable()
export class UrlsService {
  private readonly baseUrl: string;

  constructor(
    @InjectRepository(Url) private readonly urlRepository: Repository<Url>,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly aiAnalysisProducer: AiAnalysisProducer,
  ) {
    this.baseUrl = this.getHostUrl();
  }

  generateShortCode(length: number = 6): string {
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const bytes = randomBytes(length);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset[bytes[i] % charset.length];
    }
    return result;
  }

  private async generateUniqueShortCode(length: number = 6): Promise<string> {
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const shortCode = this.generateShortCode(length);
      const exists = await this.urlRepository.exists({
        where: { shortCode },
      });
      if (!exists) {
        return shortCode;
      }
    }
    throw new InternalServerErrorException(
      'Failed to generate unique short code',
    );
  }

  private toResponseDto(url: Url): UrlResponseDto {
    return {
      id: url.id,
      shortCode: url.shortCode,
      shortUrl: `${this.baseUrl}/${url.shortCode}`,
      originalUrl: url.originalUrl,
      clickCount: url.clickCount,
      isActive: url.isActive,
      expiresAt: url.expiresAt?.toISOString() ?? '',
      createdAt: url.createdAt.toISOString(),
    };
  }

  async create(
    userId: string,
    createUrlDto: CreateUrlDto,
  ): Promise<UrlResponseDto> {
    const shortCode = await this.generateUniqueShortCode();
    const url = this.urlRepository.create({
      originalUrl: createUrlDto.originalUrl,
      shortCode,
      userId,
      expiresAt: createUrlDto.expiresAt
        ? new Date(createUrlDto.expiresAt)
        : null,
    });
    const savedUrl = await this.urlRepository.save(url);

    await this.cacheManager.del(`user:urls:${userId}`);

    void this.aiAnalysisProducer.analyzeUrl({
      urlId: savedUrl.id,
      originalUrl: savedUrl.originalUrl,
    });

    return this.toResponseDto(savedUrl);
  }

  async findAllByUser(userId: string): Promise<UrlResponseDto[]> {
    const cacheKey = `user:urls:${userId}`;
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) {
      return JSON.parse(cached) as UrlResponseDto[];
    }

    const urls = await this.urlRepository.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });

    const response = urls.map((url) => this.toResponseDto(url));
    await this.cacheManager.set(cacheKey, JSON.stringify(response), 300000);
    return response;
  }

  async findOne(id: string, userId: string): Promise<UrlResponseDto> {
    const url = await this.urlRepository.findOne({
      where: { id, userId },
      relations: ['aiMetadata'],
    });
    if (!url) {
      throw new NotFoundException('URL not found');
    }
    if (url.userId !== userId) {
      throw new ForbiddenException('You can only get your own URLs');
    }

    const response = this.toResponseDto(url);
    if (url.aiMetadata) {
      response.ai = {
        summary: url.aiMetadata.summary,
        tags: url.aiMetadata.tags,
        category: url.aiMetadata.category,
      };
    }
    return response;
  }

  async remove(id: string, userId: string): Promise<UrlResponseDto> {
    const url = await this.urlRepository.findOne({
      where: { id, userId },
    });
    if (!url) {
      throw new NotFoundException('URL not found');
    }

    if (url.userId !== userId) {
      throw new ForbiddenException('You can only delete your own URLs');
    }
    url.isActive = false;
    await this.urlRepository.save(url);

    await this.invalidateUrlCache(url.shortCode, userId);

    return this.toResponseDto(url);
  }

  async resolveShortCode(shortCode: string): Promise<Url> {
    console.time('resolveShortCode');
    const cacheKey = `url:shortCode:${shortCode}`;
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) {
      const url = JSON.parse(cached) as Url;
      if (url.expiresAt && new Date() > new Date(url.expiresAt)) {
        await this.cacheManager.del(cacheKey);
        throw new NotFoundException('This short URL has expired');
      }
      await this.urlRepository.update(url.id, {
        clickCount: () => '"clickCount" + 1',
      });
      console.timeEnd('resolveShortCode');
      return url;
    }

    const url = await this.urlRepository.findOne({
      where: { shortCode, isActive: true },
    });
    if (!url) {
      throw new NotFoundException(
        'Short URL not found or has been deactivated',
      );
    }

    if (url.expiresAt && new Date() > url.expiresAt) {
      throw new NotFoundException('This short URL has expired');
    }

    await this.cacheManager.set(cacheKey, JSON.stringify(url), 300000);

    await this.urlRepository.update(url.id, {
      clickCount: () => '"clickCount" + 1',
    });

    console.timeEnd('resolveShortCode');
    return url;
  }

  private async invalidateUrlCache(
    shortCode: string,
    userId: string,
  ): Promise<void> {
    await Promise.all([
      this.cacheManager.del(`url:shortCode:${shortCode}`),
      this.cacheManager.del(`user:urls:${userId}`),
    ]);
  }

  private getHostUrl(): string {
    return process.env.FRONTEND_URL || 'http://localhost:3001';
  }
}
