import { ApiProperty } from '@nestjs/swagger';

export class TopUrlDto {
  @ApiProperty({
    example: 'a1b2c3d4-...',
  })
  id!: string;

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
    description: 'Short URL',
    example: 'http://localhost:3000/r/a8Xk2m',
  })
  shortUrl!: string;

  @ApiProperty({
    description: 'Count of clicks',
    example: 47,
  })
  totalClicks!: number;
}
