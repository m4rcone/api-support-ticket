import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { clearDatabase, closeTestDatabasePool } from '../utils/orchestrator';
import { HttpErrorHandler } from '../../src/infra/http-error-handler';

describe('POST /users', () => {
  describe('Anonymous user', () => {
    let app: INestApplication;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      app.setGlobalPrefix('/api/v1');
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
        }),
      );
      app.useGlobalFilters(new HttpErrorHandler());
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
      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
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

    test('With missing data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          email: 'john@example.com',
          password: 'securepassword',
        });

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        name: 'ValidationError',
        message: 'Aconteceu algum erro de validação.',
        action: 'Verifique os dados enviados e tente novamente.',
        statusCode: 400,
      });
    });

    test('With extra fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'securepassword',
          extraField: 'not allowed',
        });

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        name: 'ValidationError',
        message: 'Aconteceu algum erro de validação.',
        action: 'Verifique os dados enviados e tente novamente.',
        statusCode: 400,
      });
    });

    test("With invalid 'email' format", async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          name: 'John Doe',
          email: 'invalid-email-format',
          password: 'securepassword',
        });

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        name: 'ValidationError',
        message: 'Aconteceu algum erro de validação.',
        action: 'Verifique os dados enviados e tente novamente.',
        statusCode: 400,
      });
    });

    test("With duplicated 'email'", async () => {
      await request(app.getHttpServer()).post('/api/v1/users').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securepassword',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          name: 'John Smith',
          email: 'john@example.com',
          password: 'securepassword',
        });

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        name: 'ValidationError',
        message: 'O email informado já está sendo utilizado.',
        action: 'Utilize outro email para realizar a operação.',
        statusCode: 400,
      });
    });
  });
});
