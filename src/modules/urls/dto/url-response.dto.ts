import { ApiProperty } from '@nestjs/swagger';

export class UrlAiSummaryDto {
  @ApiProperty({ example: 'NestJS is a progressive Node.js framework...' })
  summary!: string;

  @ApiProperty({ example: ['nestjs', 'typescript'] })
  tags!: string[];

  @ApiProperty({ example: 'Programming' })
  category!: string;
}

export class UrlResponseDto {
  @ApiProperty({
    example: 'a1b2c3d4-...',
    description: 'ID of the URL',
    type: 'string',
  })
  id: string;

  @ApiProperty({
    example: 'abc123',
    description: 'Short URL',
    type: 'string',
  })
  shortCode: string;

  @ApiProperty({
    example: 'https://short.url/abc123',
    description: 'Short URL',
    type: 'string',
  })
  shortUrl: string;

  @ApiProperty({
    example: 'https://www.google.com',
    description: 'Original URL',
  })
  originalUrl: string;

  @ApiProperty({
    example: 10,
    description: 'Number of clicks',
    type: 'number',
  })
  clickCount: number;

  @ApiProperty({
    example: true,
    description: 'Whether the URL is active',
    type: 'boolean',
  })
  isActive: boolean;

  @ApiProperty({
    example: '2030-01-01T00:00:00.000Z',
    description: 'Expiration date for the short URL',
    type: 'string',
  })
  expiresAt: string;

  @ApiProperty({
    example: '2030-01-01T00:00:00.000Z',
    description: 'Creation date for the short URL',
    type: 'string',
  })
  createdAt: string;

  @ApiProperty({
    example: {
      summary: 'NestJS is a progressive Node.js framework...',
      tags: ['nestjs', 'typescript'],
      category: 'Programming',
    },
    description: 'AI summary for the URL',
    type: UrlAiSummaryDto,
    required: false,
  })
  ai?: UrlAiSummaryDto | null;
}
