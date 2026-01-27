import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { HttpErrorHandler } from 'src/infra/http-error-handler';
import orchestrator from 'tests/utils/orchestrator';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { UserRole } from 'src/users/users.types';
import { DatabaseService } from 'src/infra/database/database.service';

describe('PATCH /admin/users/:id/role', () => {
  let app: INestApplication;
  let db: DatabaseService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    db = moduleFixture.get(DatabaseService);

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

    orchestrator.setDatabaseService(db);
  });

  beforeEach(async () => {
    await orchestrator.clearDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Anonymous user', () => {
    test('Attempts to change user role without being authenticated', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v1/admin/users/94955f95-ccb4-426d-9c56-4f428a0e5825/role')
        .send({ role: UserRole.ADMIN });

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
    test('Attempts to change user role without admin permissions', async () => {
      const createdUser = await orchestrator.createUser({
        password: 'securePassword',
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: createdUser.email,
          password: 'securePassword',
        });

      expect(loginResponse.status).toBe(200);

      const cookies = loginResponse.headers['set-cookie'];

      expect(cookies).toBeDefined();

      const response = await request(app.getHttpServer())
        .patch('/api/v1/admin/users/94955f95-ccb4-426d-9c56-4f428a0e5825/role')
        .set('Cookie', cookies)
        .send({ role: UserRole.ADMIN });

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
    test('Attempts to change user role without admin permissions', async () => {
      const createdAgentUser = await orchestrator.createUser({
        password: 'securePassword',
        role: UserRole.AGENT,
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: createdAgentUser.email,
          password: 'securePassword',
        });

      expect(loginResponse.status).toBe(200);

      const cookies = loginResponse.headers['set-cookie'];

      expect(cookies).toBeDefined();

      const response = await request(app.getHttpServer())
        .patch('/api/v1/admin/users/94955f95-ccb4-426d-9c56-4f428a0e5825/role')
        .set('Cookie', cookies)
        .send({ role: UserRole.ADMIN });

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
    test('Changes another user role successfully', async () => {
      const createdDefaultUser = await orchestrator.createUser({});
      const createdAdminUser = await orchestrator.createUser({
        password: 'admin123',
        role: UserRole.ADMIN,
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: createdAdminUser.email,
          password: 'admin123',
        });

      expect(loginResponse.status).toBe(200);

      const cookies = loginResponse.headers['set-cookie'];

      expect(cookies).toBeDefined();

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${createdDefaultUser.id}/role`)
        .set('Cookie', cookies)
        .send({ role: UserRole.AGENT });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        id: createdDefaultUser.id,
        name: createdDefaultUser.name,
        email: createdDefaultUser.email,
        role: UserRole.AGENT,
        createdAt: response.body.createdAt,
        updatedAt: response.body.updatedAt,
      });

      expect(Date.parse(response.body.createdAt)).not.toBeNaN();
      expect(Date.parse(response.body.updatedAt)).not.toBeNaN();

      expect(response.body.updatedAt > response.body.createdAt);
    });

    test('Changes their own role when there is another admin', async () => {
      const createdAdminUser = await orchestrator.createUser({
        password: 'admin123',
        role: UserRole.ADMIN,
      });

      await orchestrator.createUser({
        role: UserRole.ADMIN,
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: createdAdminUser.email,
          password: 'admin123',
        });

      expect(loginResponse.status).toBe(200);

      const cookies = loginResponse.headers['set-cookie'];

      expect(cookies).toBeDefined();

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${createdAdminUser.id}/role`)
        .set('Cookie', cookies)
        .send({ role: UserRole.AGENT });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        id: createdAdminUser.id,
        name: createdAdminUser.name,
        email: createdAdminUser.email,
        role: UserRole.AGENT,
        createdAt: response.body.createdAt,
        updatedAt: response.body.updatedAt,
      });

      expect(Date.parse(response.body.createdAt)).not.toBeNaN();
      expect(Date.parse(response.body.updatedAt)).not.toBeNaN();

      expect(response.body.updatedAt > response.body.createdAt);
    });

    test('Attempts to change their own role when they are the only admin', async () => {
      const createdAdminUser = await orchestrator.createUser({
        password: 'admin123',
        role: UserRole.ADMIN,
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: createdAdminUser.email,
          password: 'admin123',
        });

      expect(loginResponse.status).toBe(200);

      const cookies = loginResponse.headers['set-cookie'];

      expect(cookies).toBeDefined();

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${createdAdminUser.id}/role`)
        .set('Cookie', cookies)
        .send({ role: UserRole.AGENT });

      expect(response.status).toBe(403);

      expect(response.body).toEqual({
        name: 'ForbiddenError',
        message: 'Não é permitido remover o último administrador do sistema.',
        action: 'Crie outro ADMIN antes de alterar o papel deste usuário.',
        statusCode: 403,
      });
    });

    test('Sends a request without the role field', async () => {
      const createdDefaultUser = await orchestrator.createUser({});
      const createdAdminUser = await orchestrator.createUser({
        password: 'admin123',
        role: UserRole.ADMIN,
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: createdAdminUser.email,
          password: 'admin123',
        });

      expect(loginResponse.status).toBe(200);

      const cookies = loginResponse.headers['set-cookie'];

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

    test('Sends a request with an invalid role value', async () => {
      const createdDefaultUser = await orchestrator.createUser({});
      const createdAdminUser = await orchestrator.createUser({
        password: 'admin123',
        role: UserRole.ADMIN,
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: createdAdminUser.email,
          password: 'admin123',
        });

      expect(loginResponse.status).toBe(200);

      const cookies = loginResponse.headers['set-cookie'];

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

    test('Sends a request with extra fields', async () => {
      const createdDefaultUser = await orchestrator.createUser({});
      const createdAdminUser = await orchestrator.createUser({
        password: 'admin123',
        role: UserRole.ADMIN,
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: createdAdminUser.email,
          password: 'admin123',
        });

      expect(loginResponse.status).toBe(200);

      const cookies = loginResponse.headers['set-cookie'];

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
      const createdAdminUser = await orchestrator.createUser({
        password: 'admin123',
        role: UserRole.ADMIN,
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: createdAdminUser.email,
          password: 'admin123',
        });

      expect(loginResponse.status).toBe(200);

      const cookies = loginResponse.headers['set-cookie'];

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
