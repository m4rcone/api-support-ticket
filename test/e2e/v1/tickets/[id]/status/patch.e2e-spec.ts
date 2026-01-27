import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from 'src/app.module';
import orchestrator from 'test/utils/orchestrator';
import { HttpErrorHandler } from 'src/infra/http/http-error-handler';
import { DatabaseService } from 'src/infra/database/database.service';
import { UserRole } from 'src/users/users.types';
import { TicketStatus, TicketTag } from 'src/tickets/tickets.types';

describe('PATCH /api/v1/tickets/:id/status', () => {
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
    test('Attempts to update a ticket status without access token', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v1/tickets/05d01ddc-6a7f-4c53-b3f9-13db57edf2b2/status')
        .send({ status: TicketStatus.CLOSED });

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
    test('Updates their own ticket status from OPEN to CLOSED', async () => {
      const createdUser = await orchestrator.createUser({
        password: 'securePassword',
      });

      const createdTicket = await orchestrator.createTicket({
        createdBy: createdUser.id,
        status: TicketStatus.OPEN,
        tag: TicketTag.BUG,
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
        .patch(`/api/v1/tickets/${createdTicket.id}/status`)
        .set('Cookie', cookies)
        .send({ status: TicketStatus.CLOSED });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        id: createdTicket.id,
        title: createdTicket.title,
        description: createdTicket.description,
        status: TicketStatus.CLOSED,
        tag: createdTicket.tag,
        createdBy: createdTicket.createdBy,
        assignedTo: createdTicket.assignedTo,
        createdAt: response.body.createdAt,
        updatedAt: response.body.updatedAt,
      });

      expect(response.body.updatedAt > response.body.createdAt).toBe(true);
    });

    test('Updates their own ticket status from RESOLVED to OPEN', async () => {
      const createdUser = await orchestrator.createUser({
        password: 'securePassword',
      });

      const createdTicket = await orchestrator.createTicket({
        createdBy: createdUser.id,
        status: TicketStatus.RESOLVED,
        tag: TicketTag.BUG,
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
        .patch(`/api/v1/tickets/${createdTicket.id}/status`)
        .set('Cookie', cookies)
        .send({ status: TicketStatus.OPEN });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        id: createdTicket.id,
        title: createdTicket.title,
        description: createdTicket.description,
        status: TicketStatus.OPEN,
        tag: createdTicket.tag,
        createdBy: createdTicket.createdBy,
        assignedTo: createdTicket.assignedTo,
        createdAt: response.body.createdAt,
        updatedAt: response.body.updatedAt,
      });

      expect(response.body.updatedAt > response.body.createdAt).toBe(true);
    });

    test('Attempts to update the status of a ticket from another user', async () => {
      const createdUser = await orchestrator.createUser({
        password: 'securePassword',
      });

      const anotherUser = await orchestrator.createUser({});

      const createdTicket = await orchestrator.createTicket({
        createdBy: anotherUser.id,
        status: TicketStatus.OPEN,
        tag: TicketTag.BUG,
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
        .patch(`/api/v1/tickets/${createdTicket.id}/status`)
        .set('Cookie', cookies)
        .send({ status: TicketStatus.CLOSED });

      expect(response.status).toBe(403);

      expect(response.body).toEqual({
        name: 'ForbiddenError',
        message: 'Você não tem permissão para acessar este recurso.',
        action:
          'Verifique se sua conta possui as permissões necessárias para realizar esta ação.',
        statusCode: 403,
      });
    });

    test('Attempts to update their own ticket status with an invalid transition', async () => {
      const createdUser = await orchestrator.createUser({
        password: 'securePassword',
      });

      const createdTicket = await orchestrator.createTicket({
        createdBy: createdUser.id,
        status: TicketStatus.OPEN,
        tag: TicketTag.BUG,
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

      // Exemplo de transição inválida para customer: OPEN -> RESOLVED
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/tickets/${createdTicket.id}/status`)
        .set('Cookie', cookies)
        .send({ status: TicketStatus.RESOLVED });

      expect(response.status).toBe(403);

      expect(response.body).toEqual({
        name: 'ForbiddenError',
        message:
          'Você não tem permissão para alterar o status do ticket para este valor.',
        action:
          'Verifique o status atual do ticket e as ações permitidas para a sua conta.',
        statusCode: 403,
      });
    });
  });

  describe('Authenticated agent user', () => {
    test('Updates the status of an assigned ticket from OPEN to IN PROGRESS', async () => {
      const customerUser = await orchestrator.createUser({
        password: 'securePassword',
      });

      const agentUser = await orchestrator.createUser({
        password: 'securePassword',
        role: UserRole.AGENT,
      });

      const createdTicket = await orchestrator.createTicket({
        createdBy: customerUser.id,
        assignedTo: agentUser.id,
        status: TicketStatus.OPEN,
        tag: TicketTag.BUG,
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: agentUser.email,
          password: 'securePassword',
        });

      expect(loginResponse.status).toBe(200);

      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/tickets/${createdTicket.id}/status`)
        .set('Cookie', cookies)
        .send({ status: TicketStatus.IN_PROGRESS });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        id: createdTicket.id,
        title: createdTicket.title,
        description: createdTicket.description,
        status: TicketStatus.IN_PROGRESS,
        tag: createdTicket.tag,
        createdBy: createdTicket.createdBy,
        assignedTo: agentUser.id,
        createdAt: response.body.createdAt,
        updatedAt: response.body.updatedAt,
      });

      expect(response.body.updatedAt > response.body.createdAt).toBe(true);
    });

    test('Updates the status of an assigned ticket from IN PROGRESS to RESOLVED', async () => {
      const customerUser = await orchestrator.createUser({
        password: 'securePassword',
      });

      const agentUser = await orchestrator.createUser({
        password: 'securePassword',
        role: UserRole.AGENT,
      });

      const createdTicket = await orchestrator.createTicket({
        createdBy: customerUser.id,
        assignedTo: agentUser.id,
        status: TicketStatus.IN_PROGRESS,
        tag: TicketTag.BUG,
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: agentUser.email,
          password: 'securePassword',
        });

      expect(loginResponse.status).toBe(200);

      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/tickets/${createdTicket.id}/status`)
        .set('Cookie', cookies)
        .send({ status: TicketStatus.RESOLVED });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        id: createdTicket.id,
        title: createdTicket.title,
        description: createdTicket.description,
        status: TicketStatus.RESOLVED,
        tag: createdTicket.tag,
        createdBy: createdTicket.createdBy,
        assignedTo: agentUser.id,
        createdAt: response.body.createdAt,
        updatedAt: response.body.updatedAt,
      });

      expect(response.body.updatedAt > response.body.createdAt).toBe(true);
    });

    test('Attempts to update the status of a ticket not assigned to them', async () => {
      const customerUser = await orchestrator.createUser({
        password: 'securePassword',
      });

      const agentUser = await orchestrator.createUser({
        password: 'securePassword',
        role: UserRole.AGENT,
      });

      const anotherAgentUser = await orchestrator.createUser({
        password: 'securePassword',
        role: UserRole.AGENT,
      });

      const createdTicket = await orchestrator.createTicket({
        createdBy: customerUser.id,
        assignedTo: anotherAgentUser.id,
        status: TicketStatus.OPEN,
        tag: TicketTag.BUG,
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: agentUser.email,
          password: 'securePassword',
        });

      expect(loginResponse.status).toBe(200);

      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/tickets/${createdTicket.id}/status`)
        .set('Cookie', cookies)
        .send({ status: TicketStatus.IN_PROGRESS });

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

  describe('Authenticated admin user', () => {
    test('Updates any ticket status successfully', async () => {
      const customerUser = await orchestrator.createUser({
        password: 'securePassword',
      });

      const agentUser = await orchestrator.createUser({
        password: 'securePassword',
        role: UserRole.AGENT,
      });

      const adminUser = await orchestrator.createUser({
        password: 'admin123',
        role: UserRole.ADMIN,
      });

      const createdTicket = await orchestrator.createTicket({
        createdBy: customerUser.id,
        assignedTo: agentUser.id,
        status: TicketStatus.OPEN,
        tag: TicketTag.BUG,
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: adminUser.email,
          password: 'admin123',
        });

      expect(loginResponse.status).toBe(200);

      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/tickets/${createdTicket.id}/status`)
        .set('Cookie', cookies)
        .send({ status: TicketStatus.RESOLVED });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        id: createdTicket.id,
        title: createdTicket.title,
        description: createdTicket.description,
        status: TicketStatus.RESOLVED,
        tag: createdTicket.tag,
        createdBy: createdTicket.createdBy,
        assignedTo: createdTicket.assignedTo,
        createdAt: response.body.createdAt,
        updatedAt: response.body.updatedAt,
      });

      expect(response.body.updatedAt > response.body.createdAt).toBe(true);
    });

    test('Attempts to update the status of a nonexistent ticket', async () => {
      const adminUser = await orchestrator.createUser({
        password: 'admin123',
        role: UserRole.ADMIN,
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: adminUser.email,
          password: 'admin123',
        });

      expect(loginResponse.status).toBe(200);

      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const response = await request(app.getHttpServer())
        .patch('/api/v1/tickets/05d01ddc-6a7f-4c53-b3f9-13db57edf2b2/status')
        .set('Cookie', cookies)
        .send({ status: TicketStatus.CLOSED });

      expect(response.status).toBe(404);

      expect(response.body).toEqual({
        name: 'NotFoundError',
        message: 'O id do ticket informado não foi encontrado no sistema.',
        action: 'Verifique o id informado e tente novamente.',
        statusCode: 404,
      });
    });
  });
});
