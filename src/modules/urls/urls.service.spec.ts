import { Test, TestingModule } from '@nestjs/testing';
import { UrlsService } from './urls.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Url } from './entities/url.entity';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AiAnalysisProducer } from '../jobs/producers/ai-analysis.producer';

describe('UrlsService', () => {
  let service: UrlsService;

  const mockUrlRepository = {
    create: jest.fn(),
    save: jest.fn(),
    exists: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockAiAnalysisProducer = {
    analyzeUrl: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlsService,
        {
          provide: getRepositoryToken(Url),
          useValue: mockUrlRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: AiAnalysisProducer,
          useValue: mockAiAnalysisProducer,
        },
      ],
    }).compile();

    service = module.get<UrlsService>(UrlsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateShortCode', () => {
    it('should generate a random 6 character string', () => {
      const code = service.generateShortCode();
      expect(code.length).toBe(6);
      expect(typeof code).toBe('string');
    });
  });

  describe('create', () => {
    it('should generate a unique code, save to DB, clear cache, and trigger AI job', async () => {
      mockUrlRepository.exists.mockResolvedValue(false);

      const newUrl = {
        id: 'url-123',
        shortCode: 'abC123',
        originalUrl: 'https://google.com',
        userId: 'user-123',
        clickCount: 0,
        isActive: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        expiresAt: null,
      };

      mockUrlRepository.create.mockReturnValue(newUrl);
      mockUrlRepository.save.mockResolvedValue(newUrl);

      const result = await service.create('user-123', {
        originalUrl: 'https://google.com',
      });

      expect(mockUrlRepository.save).toHaveBeenCalled();

      expect(mockCacheManager.del).toHaveBeenCalledWith('user:urls:user-123');

      expect(mockAiAnalysisProducer.analyzeUrl).toHaveBeenCalledWith({
        urlId: 'url-123',
        originalUrl: 'https://google.com',
      });

      expect(result).toHaveProperty('shortUrl');
      expect(result.shortCode).toBe('abC123');
    });
  });
});
