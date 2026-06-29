import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

describe('App API Flow (e2e)', () => {
  let app: NestFastifyApplication;
  let dataSource: DataSource;
  let jwtToken: string;
  let shortUrlCode: string;
  const testEmail = 'e2e@test.com';
  const testPassword = `TestPass123!-${Date.now()}`;

  beforeAll(async () => {
    dotenv.config({ path: '.env.test' });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    dataSource = app.get(DataSource);

    await dataSource.synchronize(true);
    await dataSource.query(`TRUNCATE "urls", "users" CASCADE;`);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/register (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: testEmail, password: testPassword });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User registered successfully');
  });

  it('/auth/login (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
    jwtToken = response.body.accessToken;
  });

  it('/urls (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/urls')
      .set('Authorization', `Bearer ${jwtToken}`) // Send the JWT!
      .send({ originalUrl: 'https://github.com/nestjs/nest' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('shortUrl');
    expect(response.body).toHaveProperty('shortCode');
    shortUrlCode = response.body.shortCode;
  });

  it('/r/:code (GET)', async () => {
    const response = await request(app.getHttpServer()).get(
      `/r/${shortUrlCode}`,
    );

    expect(response.status).toBe(302);
    expect(response.header.location).toBe('https://github.com/nestjs/nest');
  });
});
