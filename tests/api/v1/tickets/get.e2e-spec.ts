import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import orchestrator from 'tests/utils/orchestrator';
import { HttpErrorHandler } from 'src/infra/http-error-handler';
import cookieParser from 'cookie-parser';
import { UserRole } from 'src/users/users.types';
import { DatabaseService } from 'src/infra/database/database.service';

describe('GET /api/v1/tickets/:id', () => {
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
    test('Attempts to retrieve a ticket without access token', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/v1/tickets/05d01ddc-6a7f-4c53-b3f9-13db57edf2b2',
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
    test('Attempts to retrieve an existing ticket', async () => {
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

      const createdTicket = await orchestrator.createTicket({
        createdBy: createdUser.id,
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/tickets/${createdTicket.id}`)
        .set('Cookie', cookies);

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        id: createdTicket.id,
        title: createdTicket.title,
        description: createdTicket.description,
        status: createdTicket.status,
        tag: createdTicket.tag,
        createdBy: createdUser.id,
        assignedTo: createdTicket.assignedTo,
        createdAt: createdTicket.createdAt.toISOString(),
        updatedAt: createdTicket.updatedAt.toISOString(),
      });
    });

    test('Attempts to retrieve a ticket from another user', async () => {
      const createdUser = await orchestrator.createUser({
        password: 'securePassword',
      });
      const createdUser2 = await orchestrator.createUser({});

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: createdUser.email,
          password: 'securePassword',
        });

      expect(loginResponse.status).toBe(200);

      const cookies = loginResponse.headers['set-cookie'];

      expect(cookies).toBeDefined();

      const createdTicket = await orchestrator.createTicket({
        createdBy: createdUser2.id,
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/tickets/${createdTicket.id}`)
        .set('Cookie', cookies);

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
    test('Attempts to retrieve an existing ticket', async () => {
      const createdDefaultUser = await orchestrator.createUser({});
      const createdTicket = await orchestrator.createTicket({
        createdBy: createdDefaultUser.id,
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
        .get(`/api/v1/tickets/${createdTicket.id}`)
        .set('Cookie', cookies);

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        id: createdTicket.id,
        title: createdTicket.title,
        description: createdTicket.description,
        status: createdTicket.status,
        tag: createdTicket.tag,
        createdBy: createdTicket.createdBy,
        assignedTo: createdTicket.assignedTo,
        createdAt: createdTicket.createdAt.toISOString(),
        updatedAt: createdTicket.updatedAt.toISOString(),
      });
    });

    test('Attempts to retrieve a nonexistent ticket', async () => {
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
        .get(`/api/v1/tickets/05d01ddc-6a7f-4c53-b3f9-13db57edf2b2`)
        .set('Cookie', cookies);

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
