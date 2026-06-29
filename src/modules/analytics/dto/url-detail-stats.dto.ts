import { ApiProperty } from '@nestjs/swagger';
import { DailyStatsDto } from './daily-stats.dto';

export class UrlDetailStatsDto {
  @ApiProperty({
    description: 'Short code',
    example: 'a8Xk2m',
  })
  shortCode!: string;

  @ApiProperty({
    description: 'Original URL',
    example: 'https://example.com',
  })
  originalUrl!: string;

  @ApiProperty({
    description: 'Shortened URL',
    example: 'http://localhost:3000/r/a8Xk2m',
  })
  shortUrl!: string;

  @ApiProperty({
    description: 'Total clicks',
    example: 47,
  })
  totalClicks!: number;

  @ApiProperty({
    description: 'Unique IPs (approximate unique visitors)',
    example: 47,
  })
  uniqueVisitors!: number;

  @ApiProperty({
    type: [DailyStatsDto],
    description:
      'type: [DailyStatsDto], description: Clicks per day (last 7 days)',
    example: [{ date: '2022-01-01', clicks: 10 }],
  })
  dailyBreakdown!: DailyStatsDto[];

  @ApiProperty({
    description: 'Clicks grouped by browser',
    example: { Chrome: 20, Firefox: 15, Safari: 12 },
  })
  topBrowsers!: Record<string, number>;

  @ApiProperty({
    example: { 'twitter.com': 10, 'linkedin.com': 8, direct: 5 },
    description: 'Clicks grouped by referrer',
  })
  topReferers!: Record<string, number>;
}
