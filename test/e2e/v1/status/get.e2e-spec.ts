import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { DatabaseService } from 'src/infra/database/database.service';
import orchestrator from 'test/utils/orchestrator';

describe('GET /status', () => {
  let app: INestApplication;
  let db: DatabaseService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    db = moduleFixture.get(DatabaseService);

    app.setGlobalPrefix('api/v1');

    await app.init();

    orchestrator.setDatabaseService(db);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Anonymous user', () => {
    test('Retrieving current system status', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/status');

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        services: {
          database: {
            status: 'up',
            version: '18.0',
            maxConnections: 100,
            openedConnections: expect.any(Number),
          },
        },
      });
    });
  });
});
