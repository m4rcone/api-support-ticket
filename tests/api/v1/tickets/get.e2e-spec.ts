import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from 'src/app.module';
import { HttpErrorHandler } from 'src/infra/http-error-handler';
import orchestrator from 'tests/utils/orchestrator';
import { UserRole } from 'src/users/users.types';
import { Ticket, TicketStatus, TicketTag } from 'src/tickets/tickets.types';
import { DatabaseService } from 'src/infra/database/database.service';

describe('GET /api/v1/tickets', () => {
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
    test('Attempts to list tickets', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/v1/tickets',
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
    test('Lists only tickets created by the authenticated user', async () => {
      const customerUser = await orchestrator.createUser({
        password: 'securePassword',
      });

      const anotherCustomerUser = await orchestrator.createUser({
        password: 'securePassword',
      });

      const ticket1 = await orchestrator.createTicket({
        createdBy: customerUser.id,
      });

      const ticket2 = await orchestrator.createTicket({
        createdBy: customerUser.id,
      });

      await orchestrator.createTicket({
        createdBy: anotherCustomerUser.id,
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

      const response = await request(app.getHttpServer())
        .get('/api/v1/tickets')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);

      const ids = response.body.map((ticket: Ticket) => ticket.id);
      expect(ids).toEqual(expect.arrayContaining([ticket1.id, ticket2.id]));

      response.body.forEach((ticket: Ticket) => {
        expect(ticket.createdBy).toBe(customerUser.id);
      });
    });

    test('Lists tickets filtered by status', async () => {
      const customerUser = await orchestrator.createUser({
        password: 'securePassword',
      });

      await orchestrator.createTicket({
        createdBy: customerUser.id,
        status: TicketStatus.OPEN,
      });

      const resolvedTicket = await orchestrator.createTicket({
        createdBy: customerUser.id,
        status: TicketStatus.RESOLVED,
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

      const response = await request(app.getHttpServer())
        .get('/api/v1/tickets')
        .set('Cookie', cookies)
        .query({ status: TicketStatus.RESOLVED });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(resolvedTicket.id);
      expect(response.body[0].status).toBe(TicketStatus.RESOLVED);
    });

    test('Lists tickets filtered by tag', async () => {
      const customerUser = await orchestrator.createUser({
        password: 'securePassword',
      });

      await orchestrator.createTicket({
        createdBy: customerUser.id,
        tag: TicketTag.BUG,
      });

      const featureTicket = await orchestrator.createTicket({
        createdBy: customerUser.id,
        tag: TicketTag.FEATURE,
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

      const response = await request(app.getHttpServer())
        .get('/api/v1/tickets')
        .set('Cookie', cookies)
        .query({ tag: TicketTag.FEATURE });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(featureTicket.id);
      expect(response.body[0].tag).toBe(TicketTag.FEATURE);
    });

    test('Returns an empty list when filters do not match any ticket', async () => {
      const customerUser = await orchestrator.createUser({
        password: 'securePassword',
      });

      await orchestrator.createTicket({
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

      const response = await request(app.getHttpServer())
        .get('/api/v1/tickets')
        .set('Cookie', cookies)
        .query({ status: TicketStatus.CLOSED });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('Authenticated agent user', () => {
    test('Lists only tickets assigned to the authenticated agent', async () => {
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

      const ticketAssignedToAgent = await orchestrator.createTicket({
        createdBy: customerUser.id,
        assignedTo: agentUser.id,
      });

      await orchestrator.createTicket({
        createdBy: customerUser.id,
        assignedTo: anotherAgentUser.id,
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
        .get('/api/v1/tickets')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(ticketAssignedToAgent.id);
      expect(response.body[0].assignedTo).toBe(agentUser.id);
    });
  });

  describe('Authenticated admin user', () => {
    test('Lists all tickets', async () => {
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

      const ticket1 = await orchestrator.createTicket({
        createdBy: customerUser.id,
        status: TicketStatus.OPEN,
        tag: TicketTag.BUG,
      });

      const ticket2 = await orchestrator.createTicket({
        createdBy: customerUser.id,
        assignedTo: agentUser.id,
        status: TicketStatus.RESOLVED,
        tag: TicketTag.FEATURE,
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
        .get('/api/v1/tickets')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      const ids = response.body.map((ticket: Ticket) => ticket.id);
      expect(ids).toEqual(expect.arrayContaining([ticket1.id, ticket2.id]));
    });

    test('Lists tickets using pagination params', async () => {
      const customerUser = await orchestrator.createUser({
        password: 'securePassword',
      });

      const adminUser = await orchestrator.createUser({
        password: 'admin123',
        role: UserRole.ADMIN,
      });

      const ticket1 = await orchestrator.createTicket({
        createdBy: customerUser.id,
      });

      const ticket2 = await orchestrator.createTicket({
        createdBy: customerUser.id,
      });

      const ticket3 = await orchestrator.createTicket({
        createdBy: customerUser.id,
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

      const page1Response = await request(app.getHttpServer())
        .get('/api/v1/tickets')
        .set('Cookie', cookies)
        .query({ page: 1, perPage: 2 });

      expect(page1Response.status).toBe(200);
      expect(Array.isArray(page1Response.body)).toBe(true);
      expect(page1Response.body).toHaveLength(2);

      const page2Response = await request(app.getHttpServer())
        .get('/api/v1/tickets')
        .set('Cookie', cookies)
        .query({ page: 2, perPage: 2 });

      expect(page2Response.status).toBe(200);
      expect(Array.isArray(page2Response.body)).toBe(true);
      expect(page2Response.body).toHaveLength(1);

      const allIds = [
        ...page1Response.body.map((ticket: Ticket) => ticket.id),
        ...page2Response.body.map((ticket: Ticket) => ticket.id),
      ];

      expect(allIds).toEqual(
        expect.arrayContaining([ticket1.id, ticket2.id, ticket3.id]),
      );
    });
  });
});
