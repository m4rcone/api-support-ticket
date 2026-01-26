import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../src/app.module';
import orchestrator from '../../../utils/orchestrator';
import { HttpErrorHandler } from '../../../../src/infra/http-error-handler';
import { UserRole } from '../../../../src/users/users.types';

describe('POST /api/v1/users', () => {
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
      await orchestrator.clearDatabase();
    });

    afterAll(async () => {
      await app.close();
    });

    test('Submits unique and valid user data', async () => {
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
        role: UserRole.CUSTOMER,
        createdAt: response.body.createdAt,
        updatedAt: response.body.updatedAt,
      });
    });

    test('Submits with missing required fields', async () => {
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

    test('Submits with extra fields in the body', async () => {
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

    test('Submits with an invalid email format', async () => {
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

    test('Submits with a duplicated email address', async () => {
      await orchestrator.createUser({
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

    test('Submits with an explicit role field', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'securepassowrd',
          role: UserRole.ADMIN,
        });

      expect(response.status).toBe(201);

      expect(response.body).toEqual({
        id: response.body.id,
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.CUSTOMER,
        createdAt: response.body.createdAt,
        updatedAt: response.body.updatedAt,
      });
    });

    test('Submits with a password below the minimum length', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: '1234567',
        });

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        name: 'ValidationError',
        message: 'Aconteceu algum erro de validação.',
        action: 'Verifique os dados enviados e tente novamente.',
        statusCode: 400,
      });
    });

    test('Submits with an email matching an existing one in a different case', async () => {
      await orchestrator.createUser({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securepassword',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          name: 'John Doe',
          email: 'JOHN@EXAMPLE.COM',
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

    test('Submits with an explicit role field', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'securepassword',
          role: UserRole.ADMIN,
        });

      expect(response.status).toBe(201);

      expect(response.body).toEqual({
        id: response.body.id,
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.CUSTOMER,
        createdAt: response.body.createdAt,
        updatedAt: response.body.updatedAt,
      });
    });
  });
});
