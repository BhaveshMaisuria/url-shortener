import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import * as dotenv from 'dotenv';

describe('Rate Limiting (Throttler) (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    dotenv.config({ path: '.env.test' });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should block requests after 5 attempts', async () => {
    const endpoint = '/auth/login';
    const payload = { email: 'hacker@test.com', password: 'wrong' };

    for (let i = 0; i < 5; i++) {
      const res = await request(app.getHttpServer())
        .post(endpoint)
        .send(payload);

      expect(res.status).toBe(401);
    }

    const blockedRes = await request(app.getHttpServer())
      .post(endpoint)
      .send(payload);
    expect(blockedRes.status).toBe(429);
  });
});
