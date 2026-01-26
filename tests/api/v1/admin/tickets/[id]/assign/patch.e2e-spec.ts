import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { AppModule } from '../../../../../../../src/app.module';
import { HttpErrorHandler } from '../../../../../../../src/infra/http-error-handler';
import orchestrator from '../../../../../../utils/orchestrator';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { UserRole } from '../../../../../../../src/users/users.types';

describe('PATCH /admin/tickets/:id/assign', () => {
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
    test('Attempts to assign a ticket', async () => {
      const response = await request(app.getHttpServer())
        .patch(
          '/api/v1/admin/tickets/94955f95-ccb4-426d-9c56-4f428a0e5825/assign',
        )
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
    test('Attempts to assign a ticket', async () => {
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
        .patch(
          '/api/v1/admin/tickets/94955f95-ccb4-426d-9c56-4f428a0e5825/assign',
        )
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
    test('Attempts to assign a ticket', async () => {
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
        .patch(
          '/api/v1/admin/tickets/94955f95-ccb4-426d-9c56-4f428a0e5825/assign',
        )
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
    test('Attempts to assign a ticket', async () => {
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

      const createdUser = await orchestrator.createUser({
        name: 'Agent',
        email: 'agent@example.com',
        password: 'agent123',
      });

      await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${createdUser.id}/role`)
        .set('Cookie', cookies)
        .send({ role: UserRole.AGENT });

      const createdTicket = await orchestrator.createTicket({});

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/tickets/${createdTicket.id}/assign`)
        .set('Cookie', cookies)
        .send({ agentId: createdUser.id });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        id: createdTicket.id,
        title: createdTicket.title,
        description: createdTicket.description,
        status: createdTicket.status,
        tag: createdTicket.tag,
        createdBy: createdTicket.createdBy,
        assignedTo: createdUser.id,
        createdAt: response.body.createdAt,
        updatedAt: response.body.updatedAt,
      });

      expect(response.body.updatedAt > response.body.createdAt);
    });
  });
});
