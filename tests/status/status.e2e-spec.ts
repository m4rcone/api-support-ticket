import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('GET /status', () => {
  describe('Anonymous user', () => {
    let app: INestApplication;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    test('Retrieving current system status', async () => {
      const response = await request(app.getHttpServer()).get('/status');

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        services: {
          database: {
            status: 'up',
            version: '18.0',
            maxConnections: 100,
            openedConnections: 3,
          },
        },
      });
    });
  });
});
