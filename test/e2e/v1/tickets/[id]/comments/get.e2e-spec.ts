import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from 'src/app.module';
import { HttpErrorHandler } from 'src/infra/http/http-error-handler';
import { DatabaseService } from 'src/infra/database/database.service';
import orchestrator from 'test/utils/orchestrator';
import { UserRole } from 'src/users/users.types';
import { TicketStatus, TicketTag } from 'src/tickets/tickets.types';

describe('GET /api/v1/tickets/:id/comments', () => {
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
    test('Attempts to list ticket comments without access token', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/v1/tickets/05d01ddc-6a7f-4c53-b3f9-13db57edf2b2/comments',
      );

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
    test('Lists comments for their own ticket', async () => {
      const customerUser = await orchestrator.createUser({
        password: 'securePassword',
      });

      const ticket = await orchestrator.createTicket({
        createdBy: customerUser.id,
        status: TicketStatus.OPEN,
        tag: TicketTag.BUG,
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: customerUser.email,
          password: 'securePassword',
        });

      expect(loginResponse.status).toBe(200);

      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();

      // cria dois comentários no ticket
      const firstCommentResponse = await request(app.getHttpServer())
        .post(`/api/v1/tickets/${ticket.id}/comments`)
        .set('Cookie', cookies)
        .send({ content: 'First customer comment' });

      expect(firstCommentResponse.status).toBe(201);

      const secondCommentResponse = await request(app.getHttpServer())
        .post(`/api/v1/tickets/${ticket.id}/comments`)
        .set('Cookie', cookies)
        .send({ content: 'Second customer comment' });

      expect(secondCommentResponse.status).toBe(201);

      const listResponse = await request(app.getHttpServer())
        .get(`/api/v1/tickets/${ticket.id}/comments`)
        .set('Cookie', cookies);

      expect(listResponse.status).toBe(200);

      expect(Array.isArray(listResponse.body)).toBe(true);
      expect(listResponse.body.length).toBe(2);

      expect(listResponse.body[0]).toMatchObject({
        ticketId: ticket.id,
        authorId: customerUser.id,
        content: 'First customer comment',
      });

      expect(listResponse.body[1]).toMatchObject({
        ticketId: ticket.id,
        authorId: customerUser.id,
        content: 'Second customer comment',
      });

      // garante ordenação por createdAt ASC
      expect(
        new Date(listResponse.body[0].createdAt).getTime(),
      ).toBeLessThanOrEqual(new Date(listResponse.body[1].createdAt).getTime());
    });

    test('Attempts to list comments for another user ticket', async () => {
      const customerUser = await orchestrator.createUser({
        password: 'securePassword',
      });

      const anotherUser = await orchestrator.createUser({
        password: 'securePassword',
      });

      const ticket = await orchestrator.createTicket({
        createdBy: anotherUser.id,
        status: TicketStatus.OPEN,
        tag: TicketTag.BUG,
      });

      const anotherUserLoginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: anotherUser.email,
          password: 'securePassword',
        });

      expect(anotherUserLoginResponse.status).toBe(200);
      const anotherUserCookies = anotherUserLoginResponse.headers['set-cookie'];
      expect(anotherUserCookies).toBeDefined();

      const commentResponse = await request(app.getHttpServer())
        .post(`/api/v1/tickets/${ticket.id}/comments`)
        .set('Cookie', anotherUserCookies)
        .send({ content: 'Owner comment' });

      expect(commentResponse.status).toBe(201);

      const customerLoginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: customerUser.email,
          password: 'securePassword',
        });

      expect(customerLoginResponse.status).toBe(200);
      const customerCookies = customerLoginResponse.headers['set-cookie'];
      expect(customerCookies).toBeDefined();

      const listResponse = await request(app.getHttpServer())
        .get(`/api/v1/tickets/${ticket.id}/comments`)
        .set('Cookie', customerCookies);

      expect(listResponse.status).toBe(403);

      expect(listResponse.body).toEqual({
        name: 'ForbiddenError',
        message: 'Você não tem permissão para acessar este recurso.',
        action:
          'Verifique se sua conta possui as permissões necessárias para realizar esta ação.',
        statusCode: 403,
      });
    });

    test('Lists an empty comments array when there are no comments', async () => {
      const customerUser = await orchestrator.createUser({
        password: 'securePassword',
      });

      const ticket = await orchestrator.createTicket({
        createdBy: customerUser.id,
        status: TicketStatus.OPEN,
        tag: TicketTag.QUESTION,
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: customerUser.email,
          password: 'securePassword',
        });

      expect(loginResponse.status).toBe(200);
      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const listResponse = await request(app.getHttpServer())
        .get(`/api/v1/tickets/${ticket.id}/comments`)
        .set('Cookie', cookies);

      expect(listResponse.status).toBe(200);

      expect(Array.isArray(listResponse.body)).toBe(true);
      expect(listResponse.body.length).toBe(0);
    });
  });

  describe('Authenticated agent user', () => {
    test('Lists comments for an assigned ticket', async () => {
      const customerUser = await orchestrator.createUser({
        password: 'securePassword',
      });

      const agentUser = await orchestrator.createUser({
        password: 'securePassword',
        role: UserRole.AGENT,
      });

      const ticket = await orchestrator.createTicket({
        createdBy: customerUser.id,
        assignedTo: agentUser.id,
        status: TicketStatus.OPEN,
        tag: TicketTag.BUG,
      });

      const customerLoginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: customerUser.email,
          password: 'securePassword',
        });

      expect(customerLoginResponse.status).toBe(200);
      const customerCookies = customerLoginResponse.headers['set-cookie'];
      expect(customerCookies).toBeDefined();

      const commentResponse = await request(app.getHttpServer())
        .post(`/api/v1/tickets/${ticket.id}/comments`)
        .set('Cookie', customerCookies)
        .send({ content: 'Customer comment' });

      expect(commentResponse.status).toBe(201);

      const agentLoginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: agentUser.email,
          password: 'securePassword',
        });

      expect(agentLoginResponse.status).toBe(200);
      const agentCookies = agentLoginResponse.headers['set-cookie'];
      expect(agentCookies).toBeDefined();

      const listResponse = await request(app.getHttpServer())
        .get(`/api/v1/tickets/${ticket.id}/comments`)
        .set('Cookie', agentCookies);

      expect(listResponse.status).toBe(200);

      expect(Array.isArray(listResponse.body)).toBe(true);
      expect(listResponse.body.length).toBe(1);

      expect(listResponse.body[0]).toMatchObject({
        ticketId: ticket.id,
        content: 'Customer comment',
      });
    });

    test('Attempts to list comments for a ticket not assigned to them', async () => {
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

      const ticket = await orchestrator.createTicket({
        createdBy: customerUser.id,
        assignedTo: anotherAgentUser.id,
        status: TicketStatus.OPEN,
        tag: TicketTag.BUG,
      });

      const anotherAgentLoginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: anotherAgentUser.email,
          password: 'securePassword',
        });

      expect(anotherAgentLoginResponse.status).toBe(200);
      const anotherAgentCookies =
        anotherAgentLoginResponse.headers['set-cookie'];
      expect(anotherAgentCookies).toBeDefined();

      const commentResponse = await request(app.getHttpServer())
        .post(`/api/v1/tickets/${ticket.id}/comments`)
        .set('Cookie', anotherAgentCookies)
        .send({ content: 'Comment from assigned agent' });

      expect(commentResponse.status).toBe(201);

      const agentLoginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: agentUser.email,
          password: 'securePassword',
        });

      expect(agentLoginResponse.status).toBe(200);
      const agentCookies = agentLoginResponse.headers['set-cookie'];
      expect(agentCookies).toBeDefined();

      const listResponse = await request(app.getHttpServer())
        .get(`/api/v1/tickets/${ticket.id}/comments`)
        .set('Cookie', agentCookies);

      expect(listResponse.status).toBe(403);

      expect(listResponse.body).toEqual({
        name: 'ForbiddenError',
        message: 'Você não tem permissão para acessar este recurso.',
        action:
          'Verifique se sua conta possui as permissões necessárias para realizar esta ação.',
        statusCode: 403,
      });
    });
  });

  describe('Authenticated admin user', () => {
    test('Lists comments for any ticket', async () => {
      const customerUser = await orchestrator.createUser({
        password: 'securePassword',
      });

      const adminUser = await orchestrator.createUser({
        password: 'admin123',
        role: UserRole.ADMIN,
      });

      const ticket = await orchestrator.createTicket({
        createdBy: customerUser.id,
        status: TicketStatus.OPEN,
        tag: TicketTag.QUESTION,
      });

      const customerLoginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: customerUser.email,
          password: 'securePassword',
        });

      expect(customerLoginResponse.status).toBe(200);
      const customerCookies = customerLoginResponse.headers['set-cookie'];
      expect(customerCookies).toBeDefined();

      const commentResponse = await request(app.getHttpServer())
        .post(`/api/v1/tickets/${ticket.id}/comments`)
        .set('Cookie', customerCookies)
        .send({ content: 'Customer question' });

      expect(commentResponse.status).toBe(201);

      const adminLoginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: adminUser.email,
          password: 'admin123',
        });

      expect(adminLoginResponse.status).toBe(200);
      const adminCookies = adminLoginResponse.headers['set-cookie'];
      expect(adminCookies).toBeDefined();

      const listResponse = await request(app.getHttpServer())
        .get(`/api/v1/tickets/${ticket.id}/comments`)
        .set('Cookie', adminCookies);

      expect(listResponse.status).toBe(200);

      expect(Array.isArray(listResponse.body)).toBe(true);
      expect(listResponse.body.length).toBe(1);

      expect(listResponse.body[0]).toMatchObject({
        ticketId: ticket.id,
        content: 'Customer question',
      });
    });

    test('Attempts to list comments for a nonexistent ticket', async () => {
      const adminUser = await orchestrator.createUser({
        password: 'admin123',
        role: UserRole.ADMIN,
      });

      const adminLoginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: adminUser.email,
          password: 'admin123',
        });

      expect(adminLoginResponse.status).toBe(200);
      const adminCookies = adminLoginResponse.headers['set-cookie'];
      expect(adminCookies).toBeDefined();

      const response = await request(app.getHttpServer())
        .get('/api/v1/tickets/05d01ddc-6a7f-4c53-b3f9-13db57edf2b2/comments')
        .set('Cookie', adminCookies);

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
