import {
  Controller,
  Get,
  UseGuards,
  Request,
  Param,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { OverviewStatsDto } from './dto/overview-stats.dto';
import { UrlDetailStatsDto } from './dto/url-detail-stats.dto';
import { DailyStatsDto } from './dto/daily-stats.dto';
import { TopUrlDto } from './dto/top-url.dto';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Get overview statistics',
    description: 'Get overview statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'Overview stats',
    type: OverviewStatsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getOverview(
    @Request() req: { user: { id: string } },
  ): Promise<OverviewStatsDto> {
    return this.analyticsService.getOverview(req.user.id);
  }

  @Get('urls/:urlId/stats')
  @ApiParam({ name: 'urlId', description: 'URL UUID' })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Days for daily breakdown (default 7)',
  })
  @ApiOperation({
    summary: 'Get detailed stats for a specific URL',
    description: 'Get URL stats',
  })
  @ApiResponse({
    status: 200,
    description: 'URL stats',
    type: UrlDetailStatsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'URL not found',
  })
  async getUrlStats(
    @Param('urlId') urlId: string,
    @Request() req: { user: { id: string } },
    @Query('days') days?: number,
  ): Promise<UrlDetailStatsDto> {
    return this.analyticsService.getUrlStats(urlId, req.user.id, days);
  }

  @Get('daily')
  @ApiOperation({
    summary: 'Get daily stats',
    description: 'Get daily stats',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Days for daily breakdown (default 7)',
  })
  @ApiResponse({
    status: 200,
    description: 'Daily stats',
    type: DailyStatsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getDailyStats(
    @Request() req: { user: { id: string } },
    @Query('days') days?: number,
  ): Promise<DailyStatsDto[]> {
    return this.analyticsService.getDailyStats(req.user.id, days);
  }

  @Get('top-urls')
  @ApiOperation({ summary: 'Get top performing URLs' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Max results (default 10)',
  })
  @ApiResponse({ status: 200, description: 'Top URLs', type: [TopUrlDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTopUrls(
    @Request() req: { user: { id: string } },
    @Query('limit') limit?: number,
  ): Promise<TopUrlDto[]> {
    return this.analyticsService.getTopUrls(req.user.id, limit);
  }
}
