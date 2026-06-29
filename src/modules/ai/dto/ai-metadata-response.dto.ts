import { ApiProperty } from '@nestjs/swagger';

export class AiMetadataResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string;

  @ApiProperty({
    example:
      'NestJS is a progressive Node.js framework for building scalable server-side applications.',
  })
  summary!: string;

  @ApiProperty({
    example: ['nestjs', 'nodejs', 'typescript', 'backend'],
  })
  tags!: string[];

  @ApiProperty({ example: 'Programming' })
  category!: string;

  @ApiProperty({ example: '2026-06-26T...' })
  createdAt!: Date;
}
