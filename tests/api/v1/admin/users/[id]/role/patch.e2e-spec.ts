import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { AppModule } from '../../../../../../../src/app.module';
import { HttpErrorHandler } from '../../../../../../../src/infra/http-error-handler';
import orchestrator from '../../../../../../utils/orchestrator';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { UserRole } from '../../../../../../../src/users/users.types';

describe('PATCH /admin/users/:id/role', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.use(cookieParser());
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

  describe('Anonymous user', () => {
    test('Attempts to change user role', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v1/admin/users/94955f95-ccb4-426d-9c56-4f428a0e5825/role')
        .send({ role: 'ADMIN' });

      expect(response.status).toBe(401);

      expect(response.body).toEqual({
        name: 'UnauthorizedError',
        message: 'Usuário não autenticado.',
        action: 'Faça o login para continuar.',
        statusCode: 401,
      });
    });
  });

  describe('Authenticated customer user', () => {
    test('Attempts to change user role', async () => {
      await orchestrator.createUser({
        email: 'john@example.com',
        password: 'securepassword',
      });

      const authResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'john@example.com',
          password: 'securepassword',
        });

      expect(authResponse.status).toBe(200);

      const cookies = authResponse.headers['set-cookie'];

      expect(cookies).toBeDefined();

      const response = await request(app.getHttpServer())
        .patch('/api/v1/admin/users/94955f95-ccb4-426d-9c56-4f428a0e5825/role')
        .set('Cookie', cookies)
        .send({ role: 'ADMIN' });

      expect(response.status).toBe(403);

      expect(response.body).toEqual({
        name: 'ForbiddenError',
        action:
          'Verifique se sua conta possui as permissões necessárias para realizar esta ação.',
        message: 'Você não tem permissão para acessar este recurso.',
        statusCode: 403,
      });
    });
  });

  describe('Authenticated agent user', () => {
    test('Attempts to change user role', async () => {
      await orchestrator.createUser({
        email: 'john@example.com',
        password: 'securepassword',
      });

      const authResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'john@example.com',
          password: 'securepassword',
        });

      expect(authResponse.status).toBe(200);

      const cookies = authResponse.headers['set-cookie'];

      expect(cookies).toBeDefined();

      const response = await request(app.getHttpServer())
        .patch('/api/v1/admin/users/94955f95-ccb4-426d-9c56-4f428a0e5825/role')
        .set('Cookie', cookies)
        .send({ role: 'ADMIN' });

      expect(response.status).toBe(403);

      expect(response.body).toEqual({
        name: 'ForbiddenError',
        action:
          'Verifique se sua conta possui as permissões necessárias para realizar esta ação.',
        message: 'Você não tem permissão para acessar este recurso.',
        statusCode: 403,
      });
    });
  });

  describe('Authenticated admin user', () => {
    test('Changes another user role', async () => {
      const createdDefaultUser = await orchestrator.createUser({});

      await orchestrator.createAdminUser({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'admin123',
      });

      const authResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'admin123',
        });

      expect(authResponse.status).toBe(200);

      const cookies = authResponse.headers['set-cookie'];

      expect(cookies).toBeDefined();

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${createdDefaultUser.id}/role`)
        .set('Cookie', cookies)
        .send({ role: UserRole.AGENT });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        id: response.body.id,
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.AGENT,
        createdAt: response.body.createdAt,
        updatedAt: response.body.updatedAt,
      });

      expect(response.body.updatedAt > response.body.createdAt);
    });

    test('Changes their own role when there is another admin', async () => {
      const createdDefaultUser = await orchestrator.createUser({});

      await orchestrator.createAdminUser({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'admin123',
      });

      const authResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'admin123',
        });

      expect(authResponse.status).toBe(200);

      const cookies = authResponse.headers['set-cookie'];

      expect(cookies).toBeDefined();

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${createdDefaultUser.id}/role`)
        .set('Cookie', cookies)
        .send({ role: UserRole.AGENT });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        id: response.body.id,
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.AGENT,
        createdAt: response.body.createdAt,
        updatedAt: response.body.updatedAt,
      });

      expect(response.body.updatedAt > response.body.createdAt);
    });

    test('Attempts to change their role, when they are the only admin', async () => {
      const createdAdminUser = await orchestrator.createAdminUser({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'admin123',
      });

      const authResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'admin123',
        });

      expect(authResponse.status).toBe(200);

      const cookies = authResponse.headers['set-cookie'];

      expect(cookies).toBeDefined();

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${createdAdminUser.id}/role`)
        .set('Cookie', cookies)
        .send({ role: UserRole.AGENT });

      expect(response.status).toBe(403);

      expect(response.body).toEqual({
        name: 'ForbiddenError',
        message: 'Não é permitido remover o último administrador do sistema.',
        action: 'Crie outro usuário ADMIN antes de alterar esta role.',
        statusCode: 403,
      });
    });

    test('Sends a request without the role field', async () => {
      const createdDefaultUser = await orchestrator.createUser({});

      await orchestrator.createAdminUser({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'admin123',
      });

      const authResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'admin123',
        });

      expect(authResponse.status).toBe(200);

      const cookies = authResponse.headers['set-cookie'];

      expect(cookies).toBeDefined();

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${createdDefaultUser.id}/role`)
        .set('Cookie', cookies)
        .send({});

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        name: 'ValidationError',
        message: 'Aconteceu algum erro de validação.',
        action: 'Verifique os dados enviados e tente novamente.',
        statusCode: 400,
      });
    });

    test('Sends an invalid role value', async () => {
      const createdDefaultUser = await orchestrator.createUser({});

      await orchestrator.createAdminUser({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'admin123',
      });

      const authResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'admin123',
        });

      expect(authResponse.status).toBe(200);

      const cookies = authResponse.headers['set-cookie'];

      expect(cookies).toBeDefined();

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${createdDefaultUser.id}/role`)
        .set('Cookie', cookies)
        .send({ role: 'INVALID_ROLE' });

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        name: 'ValidationError',
        message: 'Aconteceu algum erro de validação.',
        action: 'Verifique os dados enviados e tente novamente.',
        statusCode: 400,
      });
    });

    test('Sends extra fields', async () => {
      const createdDefaultUser = await orchestrator.createUser({});

      await orchestrator.createAdminUser({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'admin123',
      });

      const authResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'admin123',
        });

      expect(authResponse.status).toBe(200);

      const cookies = authResponse.headers['set-cookie'];

      expect(cookies).toBeDefined();

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${createdDefaultUser.id}/role`)
        .set('Cookie', cookies)
        .send({ role: UserRole.AGENT, extraField: 'not allowed' });

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        name: 'ValidationError',
        message: 'Aconteceu algum erro de validação.',
        action: 'Verifique os dados enviados e tente novamente.',
        statusCode: 400,
      });
    });

    test('Attempts to change the role of a non-existing user', async () => {
      await orchestrator.createAdminUser({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'admin123',
      });

      const authResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'admin123',
        });

      expect(authResponse.status).toBe(200);

      const cookies = authResponse.headers['set-cookie'];

      expect(cookies).toBeDefined();

      const response = await request(app.getHttpServer())
        .patch('/api/v1/admin/users/94955f95-ccb4-426d-9c56-4f428a0e5825/role')
        .set('Cookie', cookies)
        .send({ role: UserRole.AGENT });

      expect(response.status).toBe(404);

      expect(response.body).toEqual({
        name: 'NotFoundError',
        message: 'O id informado não foi encontrado no sistema.',
        action: 'Verifique o id informado e tente novamente.',
        statusCode: 404,
      });
    });
  });
});
