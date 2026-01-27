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

describe('POST /api/v1/tickets/:id/comments', () => {
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
    test('Attempts to add a comment to a ticket without access token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/tickets/05d01ddc-6a7f-4c53-b3f9-13db57edf2b2/comments')
        .send({ content: 'Test comment' });

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
    test('Adds a comment to their own ticket', async () => {
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
        .post(`/api/v1/tickets/${createdTicket.id}/comments`)
        .set('Cookie', cookies)
        .send({ content: 'First comment from customer' });

      expect(response.status).toBe(201);

      expect(response.body).toMatchObject({
        id: response.body.id,
        ticketId: createdTicket.id,
        authorId: createdUser.id,
        content: 'First comment from customer',
        createdAt: response.body.createdAt,
        updatedAt: response.body.updatedAt,
      });

      expect(new Date(response.body.createdAt)).not.toBeNaN();
      expect(new Date(response.body.updatedAt)).not.toBeNaN();
    });

    test('Attempts to add a comment to another user ticket', async () => {
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
        .post(`/api/v1/tickets/${createdTicket.id}/comments`)
        .set('Cookie', cookies)
        .send({ content: 'Trying to comment another user ticket' });

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
    test('Adds a comment to an assigned ticket', async () => {
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
        .post(`/api/v1/tickets/${createdTicket.id}/comments`)
        .set('Cookie', cookies)
        .send({ content: 'Agent working on the ticket' });

      expect(response.status).toBe(201);

      expect(response.body).toMatchObject({
        id: response.body.id,
        ticketId: createdTicket.id,
        authorId: agentUser.id,
        content: 'Agent working on the ticket',
        createdAt: response.body.createdAt,
        updatedAt: response.body.updatedAt,
      });

      expect(new Date(response.body.createdAt)).not.toBeNaN();
      expect(new Date(response.body.updatedAt)).not.toBeNaN();
    });

    test('Attempts to add a comment to a ticket not assigned to them', async () => {
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
        .post(`/api/v1/tickets/${createdTicket.id}/comments`)
        .set('Cookie', cookies)
        .send({ content: 'Trying to comment on unassigned ticket' });

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
    test('Adds a comment to any ticket', async () => {
      const customerUser = await orchestrator.createUser({
        password: 'securePassword',
      });

      const adminUser = await orchestrator.createUser({
        password: 'admin123',
        role: UserRole.ADMIN,
      });

      const createdTicket = await orchestrator.createTicket({
        createdBy: customerUser.id,
        status: TicketStatus.OPEN,
        tag: TicketTag.QUESTION,
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
        .post(`/api/v1/tickets/${createdTicket.id}/comments`)
        .set('Cookie', cookies)
        .send({ content: 'Admin internal note' });

      expect(response.status).toBe(201);

      expect(response.body).toMatchObject({
        id: response.body.id,
        ticketId: createdTicket.id,
        authorId: adminUser.id,
        content: 'Admin internal note',
        createdAt: response.body.createdAt,
        updatedAt: response.body.updatedAt,
      });

      expect(new Date(response.body.createdAt)).not.toBeNaN();
      expect(new Date(response.body.updatedAt)).not.toBeNaN();
    });

    test('Attempts to add a comment to a nonexistent ticket', async () => {
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
        .post('/api/v1/tickets/05d01ddc-6a7f-4c53-b3f9-13db57edf2b2/comments')
        .set('Cookie', cookies)
        .send({ content: 'Comment on nonexistent ticket' });

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
