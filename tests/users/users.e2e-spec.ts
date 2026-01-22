import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { clearDatabase, closeTestDatabasePool } from '../utils/orchestrator';

describe('POST /users', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeTestDatabasePool();
    await app.close();
  });

  test('With unique and valid data', async () => {
    const response = await request(app.getHttpServer()).post('/users').send({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'securepassword',
    });

    expect(response.status).toBe(201);

    expect(response.body).toEqual({
      id: response.body.id,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'CUSTOMER',
      createdAt: response.body.createdAt,
      updatedAt: response.body.updatedAt,
    });
  });
});
