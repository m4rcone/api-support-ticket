import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../src/app.module';
import orchestrator from '../../../utils/orchestrator';
import { HttpErrorHandler } from '../../../../src/infra/http-error-handler';
import cookieParser from 'cookie-parser';

describe('GET /api/v1/tickets/:id', () => {
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
    test('Without token', async () => {
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
    test("With existent ticket 'id'", async () => {
      const createdUser = await orchestrator.createUser({
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

    test('With ticket id from another user', async () => {
      await orchestrator.createUser({
        email: 'john@example.com',
        password: 'securepassword',
      });

      const createdUser2 = await orchestrator.createUser({
        email: 'john2@example.com',
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
    test("With any existent ticket 'id'", async () => {
      const createdDefaultUser = await orchestrator.createUser({});
      const createdTicket = await orchestrator.createTicket({
        createdBy: createdDefaultUser.id,
      });

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
        .get(`/api/v1/tickets/${createdTicket.id}`)
        .set('Cookie', cookies);

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        id: createdTicket.id,
        title: createdTicket.title,
        description: createdTicket.description,
        status: createdTicket.status,
        tag: createdTicket.tag,
        createdBy: createdDefaultUser.id,
        assignedTo: null,
        createdAt: response.body.createdAt,
        updatedAt: response.body.updatedAt,
      });
    });

    test("With nonexistent ticket 'id'", async () => {
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
