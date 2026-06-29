import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { UrlsService } from './urls.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreateUrlDto } from './dto/create-url.dto';
import { UrlResponseDto } from './dto/url-response.dto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { SkipThrottle } from '@nestjs/throttler';
import { AnalyticsProducer } from '../jobs/producers/analytics.producer';

@ApiTags('URLs')
@Controller()
export class UrlsController {
  constructor(
    private readonly urlsService: UrlsService,
    private readonly analyticsProducer: AnalyticsProducer,
  ) {}

  @Post('urls')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create URL',
    description: 'Create a new short URL',
  })
  @ApiResponse({
    status: 200,
    description: 'URL created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async create(
    @Body() createUrlDto: CreateUrlDto,
    @Request() req: { user: { id: string } },
  ): Promise<UrlResponseDto> {
    return this.urlsService.create(req.user.id, createUrlDto);
  }

  @Get('urls')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get all URLs',
    description: 'Get all URLs for the logged in user',
  })
  @ApiResponse({
    status: 200,
    description: 'URLs retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findAll(
    @Request() req: { user: { id: string } },
  ): Promise<UrlResponseDto[]> {
    return this.urlsService.findAllByUser(req.user.id);
  }

  @Get('urls/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'URL UUID' })
  @ApiOperation({
    summary: 'Get a URL',
    description: 'Get a URL by ID',
  })
  @ApiResponse({
    status: 200,
    description: 'URL retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'URL not found',
  })
  async findOne(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ): Promise<UrlResponseDto> {
    return this.urlsService.findOne(id, req.user.id);
  }

  @Delete('urls/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', description: 'URL UUID' })
  @ApiOperation({
    summary: 'Delete a URL',
    description: 'Delete a URL by ID',
  })
  @ApiResponse({
    status: 200,
    description: 'URL deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'URL not found',
  })
  async remove(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ): Promise<UrlResponseDto> {
    return this.urlsService.remove(id, req.user.id);
  }

  @Get('r/:shortCode')
  @SkipThrottle()
  @ApiTags('Redirect')
  @ApiParam({
    name: 'shortCode',
    description: 'Short code',
    example: 'aB1cD2',
  })
  @ApiOperation({
    summary: 'Redirect to original URL',
    description: 'Redirect to original URL using short code',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirected to original URL successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'URL not found',
  })
  async redirect(
    @Param('shortCode') shortCode: string,
    @Request() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const url = await this.urlsService.resolveShortCode(shortCode);
    void this.analyticsProducer.trackClick({
      urlId: url.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
      referer: Array.isArray(req.headers['referer'])
        ? (req.headers['referer'][0] ?? null)
        : (req.headers['referer'] ?? null),
    });
    reply.status(302).redirect(url.originalUrl);
  }
}
