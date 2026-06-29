import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return health status', () => {
      jest
        .spyOn(appController['appService'], 'getHealth')
        .mockImplementation(() => ({
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
        }));
      const result = appController.getHealth();
      expect(result.status).toEqual('ok');
    });
  });
});
