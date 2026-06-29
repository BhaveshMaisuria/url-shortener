import { ApiProperty } from '@nestjs/swagger';

export class OverviewStatsDto {
  @ApiProperty({
    example: 156,
    description: 'Total number of clicks across all URLs',
  })
  totalClicks: number;

  @ApiProperty({ example: 25, description: 'Total number of created URLs' })
  totalUrls: number;

  @ApiProperty({ example: 10, description: 'Currently active URLs' })
  activeUrls: number;
}
