import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Url } from '../urls/entities/url.entity';
import { UrlAnalytics } from './entities/url-analytics.entity';
import { OverviewStatsDto } from './dto/overview-stats.dto';
import { UrlDetailStatsDto } from './dto/url-detail-stats.dto';
import { DailyStatsDto } from './dto/daily-stats.dto';
import { TopUrlDto } from './dto/top-url.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(UrlAnalytics)
    private readonly analyticsRepository: Repository<UrlAnalytics>,
    @InjectRepository(Url)
    private readonly urlRepository: Repository<Url>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async trackClick(params: {
    urlId: string;
    ipAddress?: string;
    userAgent?: string;
    referer?: string;
  }): Promise<void> {
    try {
      const analytics = this.analyticsRepository.create({
        urlId: params.urlId,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        referer: params.referer || null,
      });
      await this.analyticsRepository.save(analytics);
    } catch (error) {
      console.error('[Analytics] Failed to track click:', error);
    }
  }

  async getOverview(userId: string): Promise<OverviewStatsDto> {
    const cacheKey = `analytics:overview:${userId}`;
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) {
      return JSON.parse(cached) as OverviewStatsDto;
    }
    const [totalUrls, activeUrls] = await Promise.all([
      this.urlRepository.count({ where: { userId } }),
      this.urlRepository.count({ where: { userId, isActive: true } }),
    ]);

    const totalClicks = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .innerJoin('analytics.url', 'url')
      .where('url.userId = :userId', { userId })
      .getCount();

    const result: OverviewStatsDto = {
      totalUrls: Number(totalUrls),
      activeUrls: Number(activeUrls),
      totalClicks: Number(totalClicks),
    };

    await this.cacheManager.set(cacheKey, JSON.stringify(result), 60000);

    return result;
  }

  async getUrlStats(
    urlId: string,
    userId: string,
    days: number = 7,
  ): Promise<UrlDetailStatsDto> {
    const url = await this.urlRepository.findOne({
      where: { id: urlId },
    });

    if (!url) {
      throw new NotFoundException(`Url not found`);
    }

    if (url.userId !== userId) {
      throw new UnauthorizedException(`Unauthorized to view this url stats`);
    }

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    const [
      totalClicks,
      uniqueVisitors,
      dailyBreakdown,
      rawBrowsers,
      rawReferers,
    ] = await Promise.all([
      this.analyticsRepository.count({ where: { urlId } }),

      this.analyticsRepository
        .createQueryBuilder('analytics')
        .select('COUNT(DISTINCT analytics.ipAddress)', 'count')
        .where('analytics.urlId = :urlId', { urlId })
        .getRawOne()
        .then((r: { count: string } | undefined) =>
          Number.parseInt(r?.count || '0', 10),
        ),

      this.analyticsRepository
        .createQueryBuilder('analytics')
        .select('DATE(analytics.clickedAt)', 'date')
        .addSelect('COUNT(*)', 'clicks')
        .where('analytics.urlId = :urlId', { urlId })
        .andWhere('analytics.clickedAt >= :sinceDate', { sinceDate })
        .groupBy('DATE(analytics.clickedAt)')
        .orderBy('date', 'ASC')
        .getRawMany<{ date: string; clicks: string }>(),

      this.analyticsRepository
        .createQueryBuilder('analytics')
        .select('analytics.userAgent', 'userAgent')
        .addSelect('COUNT(*)', 'count')
        .where('analytics.urlId = :urlId', { urlId })
        .andWhere('analytics.userAgent IS NOT NULL')
        .groupBy('analytics.userAgent')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany<{ userAgent: string; count: string }>(),

      this.analyticsRepository
        .createQueryBuilder('analytics')
        .select('analytics.referer', 'referer')
        .addSelect('COUNT(*)', 'count')
        .where('analytics.urlId = :urlId', { urlId })
        .andWhere('analytics.referer IS NOT NULL')
        .groupBy('analytics.referer')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany<{ referer: string; count: string }>(),
    ]);

    const topBrowsers: Record<string, number> = {};
    for (const row of rawBrowsers) {
      const browser = this.parseBrowser(row.userAgent);
      topBrowsers[browser] =
        (topBrowsers[browser] || 0) + Number.parseInt(row.count, 10);
    }

    const topReferers: Record<string, number> = {};
    for (const row of rawReferers) {
      const referer = row.referer || 'direct';
      topReferers[referer] = Number.parseInt(row.count, 10);
    }

    const formattedDailyBreakdown: DailyStatsDto[] = dailyBreakdown.map(
      (row) => ({
        date:
          typeof row.date === 'string'
            ? row.date.split('T')[0]
            : new Date(row.date).toISOString().split('T')[0],
        clicks: Number.parseInt(row.clicks, 10),
      }),
    );

    return {
      shortCode: url.shortCode,
      originalUrl: url.originalUrl,
      shortUrl: `http://localhost:3000/r/${url.shortCode}`,
      totalClicks,
      uniqueVisitors,
      dailyBreakdown: formattedDailyBreakdown,
      topBrowsers,
      topReferers,
    };
  }

  async getTopUrls(userId: string, limit: number = 10): Promise<TopUrlDto[]> {
    const baseUrl =
      process.env.BASE_URL ||
      process.env.FRONTEND_URL ||
      'http://localhost:3000';

    const results = await this.urlRepository
      .createQueryBuilder('url')
      .leftJoin('url.analytics', 'analytics')
      .select('url.id', 'id')
      .addSelect('url.shortCode', 'shortCode')
      .addSelect('url.originalUrl', 'originalUrl')
      .addSelect('COUNT(analytics.id)', 'totalClicks')
      .where('url.userId = :userId', { userId })
      .andWhere('url.isActive = true')
      .groupBy('url.id')
      .orderBy('"totalClicks"', 'DESC')
      .limit(limit)
      .getRawMany<{
        id: string;
        shortCode: string;
        originalUrl: string;
        totalClicks: string;
      }>();
    return results.map((row) => ({
      id: row.id,
      shortCode: row.shortCode,
      originalUrl: row.originalUrl,
      shortUrl: `${baseUrl}/r/${row.shortCode}`,
      totalClicks: Number.parseInt(row.totalClicks, 10),
    }));
  }

  async getDailyStats(
    userId: string,
    days: number = 7,
  ): Promise<DailyStatsDto[]> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    const results = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .innerJoin('analytics.url', 'url')
      .select('DATE(analytics.clickedAt)', 'date')
      .addSelect('COUNT(*)', 'clicks')
      .where('url.userId = :userId', { userId })
      .andWhere('analytics.clickedAt >= :sinceDate', { sinceDate })
      .groupBy('DATE(analytics.clickedAt)')
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; clicks: string }>();
    return results.map((row) => ({
      date:
        typeof row.date === 'string'
          ? row.date.split('T')[0]
          : new Date(row.date).toISOString().split('T')[0],
      clicks: Number.parseInt(row.clicks, 10),
    }));
  }

  private parseBrowser(userAgent: string): string {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Edg/')) return 'Edge';
    if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/'))
      return 'Chrome';
    if (userAgent.includes('Firefox/')) return 'Firefox';
    if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/'))
      return 'Safari';
    if (userAgent.includes('Opera/') || userAgent.includes('OPR/'))
      return 'Opera';
    return 'Other';
  }
}
