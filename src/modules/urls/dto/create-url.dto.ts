import { IsDateString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUrlDto {
  @IsUrl()
  @ApiProperty({
    example: 'https://www.google.com',
    description: 'Original URL to be shortened',
  })
  originalUrl!: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    example: '2030-01-01T00:00:00.000Z',
    description: 'Optional expiration date for the short URL',
    required: false,
  })
  expiresAt?: string;
}
