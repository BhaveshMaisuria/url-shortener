import request from 'supertest';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

async function test(app: NestFastifyApplication) {
  const req = await request(app.getHttpServer()).get('/test').expect(302);
}
