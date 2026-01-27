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

describe('GET /api/v1/tickets/:id/status-history', () => {
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
    test('Attempts to retrieve ticket status history without access token', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/v1/tickets/05d01ddc-6a7f-4c53-b3f9-13db57edf2b2/status-history',
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
    test('Retrieves status history for their own ticket', async () => {
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
        tag: TicketTag.BUG,
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

      // OPEN -> IN_PROGRESS
      const firstUpdateResponse = await request(app.getHttpServer())
        .patch(`/api/v1/tickets/${createdTicket.id}/status`)
        .set('Cookie', adminCookies)
        .send({ status: TicketStatus.IN_PROGRESS });

      expect(firstUpdateResponse.status).toBe(200);

      // IN_PROGRESS -> RESOLVED
      const secondUpdateResponse = await request(app.getHttpServer())
        .patch(`/api/v1/tickets/${createdTicket.id}/status`)
        .set('Cookie', adminCookies)
        .send({ status: TicketStatus.RESOLVED });

      expect(secondUpdateResponse.status).toBe(200);

      const customerLoginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: customerUser.email,
          password: 'securePassword',
        });

      expect(customerLoginResponse.status).toBe(200);
      const customerCookies = customerLoginResponse.headers['set-cookie'];
      expect(customerCookies).toBeDefined();

      const historyResponse = await request(app.getHttpServer())
        .get(`/api/v1/tickets/${createdTicket.id}/status-history`)
        .set('Cookie', customerCookies);

      expect(historyResponse.status).toBe(200);

      expect(Array.isArray(historyResponse.body)).toBe(true);
      expect(historyResponse.body.length).toBe(2);

      expect(historyResponse.body[0]).toMatchObject({
        id: historyResponse.body[0].id,
        ticketId: createdTicket.id,
        previousStatus: TicketStatus.OPEN,
        newStatus: TicketStatus.IN_PROGRESS,
        changedBy: adminUser.id,
        createdAt: historyResponse.body[0].createdAt,
      });

      expect(historyResponse.body[1]).toMatchObject({
        id: historyResponse.body[1].id,
        ticketId: createdTicket.id,
        previousStatus: TicketStatus.IN_PROGRESS,
        newStatus: TicketStatus.RESOLVED,
        changedBy: adminUser.id,
        createdAt: historyResponse.body[1].createdAt,
      });
    });

    test('Attempts to retrieve status history for another user ticket', async () => {
      const customerUser = await orchestrator.createUser({
        password: 'securePassword',
      });

      const anotherUser = await orchestrator.createUser({
        password: 'securePassword',
      });

      const adminUser = await orchestrator.createUser({
        password: 'admin123',
        role: UserRole.ADMIN,
      });

      const createdTicket = await orchestrator.createTicket({
        createdBy: anotherUser.id,
        status: TicketStatus.OPEN,
        tag: TicketTag.BUG,
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

      await request(app.getHttpServer())
        .patch(`/api/v1/tickets/${createdTicket.id}/status`)
        .set('Cookie', adminCookies)
        .send({ status: TicketStatus.IN_PROGRESS });

      const customerLoginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: customerUser.email,
          password: 'securePassword',
        });

      expect(customerLoginResponse.status).toBe(200);
      const customerCookies = customerLoginResponse.headers['set-cookie'];
      expect(customerCookies).toBeDefined();

      const response = await request(app.getHttpServer())
        .get(`/api/v1/tickets/${createdTicket.id}/status-history`)
        .set('Cookie', customerCookies);

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
    test('Retrieves status history for an assigned ticket', async () => {
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

      const adminLoginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: adminUser.email,
          password: 'admin123',
        });

      expect(adminLoginResponse.status).toBe(200);
      const adminCookies = adminLoginResponse.headers['set-cookie'];
      expect(adminCookies).toBeDefined();

      await request(app.getHttpServer())
        .patch(`/api/v1/tickets/${createdTicket.id}/status`)
        .set('Cookie', adminCookies)
        .send({ status: TicketStatus.IN_PROGRESS });

      const agentLoginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: agentUser.email,
          password: 'securePassword',
        });

      expect(agentLoginResponse.status).toBe(200);
      const agentCookies = agentLoginResponse.headers['set-cookie'];
      expect(agentCookies).toBeDefined();

      const response = await request(app.getHttpServer())
        .get(`/api/v1/tickets/${createdTicket.id}/status-history`)
        .set('Cookie', agentCookies);

      expect(response.status).toBe(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);

      expect(response.body[0]).toMatchObject({
        id: response.body[0].id,
        ticketId: createdTicket.id,
        previousStatus: TicketStatus.OPEN,
        newStatus: TicketStatus.IN_PROGRESS,
        changedBy: adminUser.id,
        createdAt: response.body[0].createdAt,
      });
    });

    test('Attempts to retrieve status history for a ticket not assigned to them', async () => {
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

      const adminUser = await orchestrator.createUser({
        password: 'admin123',
        role: UserRole.ADMIN,
      });

      const createdTicket = await orchestrator.createTicket({
        createdBy: customerUser.id,
        assignedTo: anotherAgentUser.id,
        status: TicketStatus.OPEN,
        tag: TicketTag.BUG,
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

      await request(app.getHttpServer())
        .patch(`/api/v1/tickets/${createdTicket.id}/status`)
        .set('Cookie', adminCookies)
        .send({ status: TicketStatus.IN_PROGRESS });

      const agentLoginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: agentUser.email,
          password: 'securePassword',
        });

      expect(agentLoginResponse.status).toBe(200);
      const agentCookies = agentLoginResponse.headers['set-cookie'];
      expect(agentCookies).toBeDefined();

      const response = await request(app.getHttpServer())
        .get(`/api/v1/tickets/${createdTicket.id}/status-history`)
        .set('Cookie', agentCookies);

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
    test('Retrieves status history for any ticket', async () => {
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

      const adminLoginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: adminUser.email,
          password: 'admin123',
        });

      expect(adminLoginResponse.status).toBe(200);
      const adminCookies = adminLoginResponse.headers['set-cookie'];
      expect(adminCookies).toBeDefined();

      await request(app.getHttpServer())
        .patch(`/api/v1/tickets/${createdTicket.id}/status`)
        .set('Cookie', adminCookies)
        .send({ status: TicketStatus.IN_PROGRESS });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/tickets/${createdTicket.id}/status-history`)
        .set('Cookie', adminCookies);

      expect(response.status).toBe(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);

      expect(response.body[0]).toMatchObject({
        id: response.body[0].id,
        ticketId: createdTicket.id,
        previousStatus: TicketStatus.OPEN,
        newStatus: TicketStatus.IN_PROGRESS,
        changedBy: adminUser.id,
        createdAt: response.body[0].createdAt,
      });
    });

    test('Attempts to retrieve status history for a nonexistent ticket', async () => {
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
        .get(
          '/api/v1/tickets/05d01ddc-6a7f-4c53-b3f9-13db57edf2b2/status-history',
        )
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
