import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiMetadataResponseDto } from './dto/ai-metadata-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Url } from '../urls/entities/url.entity';

@ApiTags('AI Analysis')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    @InjectRepository(Url)
    private readonly urlRepository: Repository<Url>,
  ) {}

  @Get('urls/:urlId/metadata')
  @ApiOperation({ summary: 'Get AI-generated metadata for a URL' })
  @ApiParam({ name: 'urlId', description: 'URL UUID' })
  @ApiResponse({
    status: 200,
    description: 'AI metadata',
    type: AiMetadataResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'URL not found or AI analysis not yet complete',
  })
  async getMetadata(
    @Param('urlId') urlId: string,
    @Request() req: { user: { id: string } },
  ): Promise<AiMetadataResponseDto> {
    // Verify URL belongs to user
    const url = await this.urlRepository.findOne({
      where: { id: urlId, userId: req.user.id },
    });
    if (!url) {
      throw new NotFoundException('URL not found');
    }

    const metadata = await this.aiService.getMetadataByUrlId(urlId);
    if (!metadata) {
      throw new NotFoundException(
        'AI analysis is still processing. Please try again in a few seconds.',
      );
    }

    return {
      id: metadata.id,
      summary: metadata.summary,
      tags: metadata.tags,
      category: metadata.category,
      createdAt: metadata.createdAt,
    };
  }
}
