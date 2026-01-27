import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { HttpErrorHandler } from 'src/infra/http/http-error-handler';
import orchestrator from 'test/utils/orchestrator';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { UserRole } from 'src/users/users.types';
import { DatabaseService } from 'src/infra/database/database.service';

describe('PATCH /admin/tickets/:id/assign', () => {
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
    test('Attempts to assign a ticket', async () => {
      const response = await request(app.getHttpServer())
        .patch(
          '/api/v1/admin/tickets/94955f95-ccb4-426d-9c56-4f428a0e5825/assign',
        )
        .send({ agentId: '94955f95-ccb4-426d-9c56-4f428a0e5825' });

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
        .patch(
          '/api/v1/admin/tickets/94955f95-ccb4-426d-9c56-4f428a0e5825/assign',
        )
        .set('Cookie', cookies)
        .send({ agentId: '94955f95-ccb4-426d-9c56-4f428a0e5825' });

      expect(response.status).toBe(403);

      expect(response.body).toEqual({
        name: 'ForbiddenError',
        message: 'Você não tem permissão para acessar este recurso.',
        action:
          'Verifique se sua conta possui as permissões necessárias para realizar esta ação.',
        statusCode: 403,
      });
    });
  });

  describe('Authenticated agent user', () => {
    test('Attempts to assign a ticket', async () => {
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
        .patch(
          '/api/v1/admin/tickets/94955f95-ccb4-426d-9c56-4f428a0e5825/assign',
        )
        .set('Cookie', cookies)
        .send({ agentId: '94955f95-ccb4-426d-9c56-4f428a0e5825' });

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
    test('Attempts to assign a ticket to an agent user', async () => {
      const createdDefaultUser = await orchestrator.createUser({});
      const createdTicket = await orchestrator.createTicket({
        createdBy: createdDefaultUser.id,
      });
      const createdAgentUser = await orchestrator.createUser({
        password: 'securePassword',
        role: UserRole.AGENT,
      });

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
        .patch(`/api/v1/admin/tickets/${createdTicket.id}/assign`)
        .set('Cookie', cookies)
        .send({ agentId: createdAgentUser.id });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        id: createdTicket.id,
        title: createdTicket.title,
        description: createdTicket.description,
        status: createdTicket.status,
        tag: createdTicket.tag,
        createdBy: createdTicket.createdBy,
        assignedTo: createdAgentUser.id,
        createdAt: response.body.createdAt,
        updatedAt: response.body.updatedAt,
      });

      expect(response.body.updatedAt > response.body.createdAt);
    });

    test('Attempts to assign a ticket to a customer user', async () => {
      const createdDefaultUser = await orchestrator.createUser({});
      const createdTicket = await orchestrator.createTicket({
        createdBy: createdDefaultUser.id,
      });
      const createdDefaultUser2 = await orchestrator.createUser({});

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
        .patch(`/api/v1/admin/tickets/${createdTicket.id}/assign`)
        .set('Cookie', cookies)
        .send({ agentId: createdDefaultUser2.id });

      expect(response.status).toBe(403);

      expect(response.body).toEqual({
        name: 'ForbiddenError',
        message: 'O ticket não pode ser atribuído a um customer',
        action: 'Verifique o id do usuário informado e tente novamente',
        statusCode: 403,
      });
    });

    test('Attempts to assign a nonexistent ticket', async () => {
      const createdAgentUser = await orchestrator.createUser({
        role: UserRole.AGENT,
      });
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
        .patch(
          '/api/v1/admin/tickets/94955f95-ccb4-426d-9c56-4f428a0e5825/assign',
        )
        .set('Cookie', cookies)
        .send({ agentId: createdAgentUser.id });

      expect(response.status).toBe(404);

      expect(response.body).toEqual({
        name: 'NotFoundError',
        message: 'O id do ticket informado não foi encontrado no sistema.',
        action: 'Verifique o id informado e tente novamente.',
        statusCode: 404,
      });
    });

    test('Attempts to assign a ticket without providing agentId', async () => {
      const createdUser = await orchestrator.createUser({});
      const createdTicket = await orchestrator.createTicket({
        createdBy: createdUser.id,
      });
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
        .patch(`/api/v1/admin/tickets/${createdTicket.id}/assign`)
        .set('Cookie', cookies)
        .send();

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        name: 'ValidationError',
        message: 'Aconteceu algum erro de validação.',
        action: 'Verifique os dados enviados e tente novamente.',
        statusCode: 400,
      });
    });

    test('Attempts to assign a ticket with an invalid agentId', async () => {
      const createdUser = await orchestrator.createUser({});
      const createdTicket = await orchestrator.createTicket({
        createdBy: createdUser.id,
      });
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
        .patch(`/api/v1/admin/tickets/${createdTicket.id}/assign`)
        .set('Cookie', cookies)
        .send({ agentId: 'invalid-agent-id' });

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        name: 'ValidationError',
        message: 'Aconteceu algum erro de validação.',
        action: 'Verifique os dados enviados e tente novamente.',
        statusCode: 400,
      });
    });

    test('Attempts to assign a ticket that is already assigned', async () => {
      const createdDefaultUser = await orchestrator.createUser({});
      const createdAgentUser = await orchestrator.createUser({
        role: UserRole.AGENT,
      });
      const createdAgentUser2 = await orchestrator.createUser({
        role: UserRole.AGENT,
      });

      const createdTicket = await orchestrator.createTicket({
        createdBy: createdDefaultUser.id,
        assignedTo: createdAgentUser.id,
      });
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
        .patch(`/api/v1/admin/tickets/${createdTicket.id}/assign`)
        .set('Cookie', cookies)
        .send({ agentId: createdAgentUser2.id });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        id: createdTicket.id,
        title: createdTicket.title,
        description: createdTicket.description,
        status: createdTicket.status,
        tag: createdTicket.tag,
        createdBy: createdTicket.createdBy,
        assignedTo: createdAgentUser2.id,
        createdAt: response.body.createdAt,
        updatedAt: response.body.updatedAt,
      });

      expect(response.body.updatedAt > response.body.createdAt);
    });
  });
});
