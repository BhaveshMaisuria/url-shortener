import { ApiProperty } from '@nestjs/swagger';

export class DailyStatsDto {
  @ApiProperty({
    example: '2022-01-01',
    description: 'Date in YYYY-MM-DD format',
  })
  date: string;

  @ApiProperty({
    example: 10,
    description: 'Number of clicks on that day',
  })
  clicks: number;
}
