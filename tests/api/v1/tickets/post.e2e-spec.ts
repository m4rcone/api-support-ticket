import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../src/app.module';
import orchestrator from '../../../utils/orchestrator';
import { HttpErrorHandler } from '../../../../src/infra/http-error-handler';
import cookieParser from 'cookie-parser';
import { TicketStatus, TicketTag } from '../../../../src/tickets/tickets.types';

describe('POST /api/v1/tickets', () => {
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
    test('Submits unique and valid ticket data', async () => {
      const createdUser = await orchestrator.createUser({});

      const response = await request(app.getHttpServer())
        .post('/api/v1/tickets')
        .send({
          title: 'Ticket Title ',
          description: 'Ticket description',
          status: TicketStatus.OPEN,
          tag: TicketTag.BUG,
          created_by: createdUser.id,
        });

      expect(response.status).toBe(401);

      expect(response.body).toEqual({
        name: 'UnauthorizedError',
        message: 'Usuário não autenticado.',
        action: 'Faça o login para continuar.',
        statusCode: 401,
      });
    });
  });

  describe('Authenticated user', () => {
    test('Submits unique and valid ticket data', async () => {
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

      const response = await request(app.getHttpServer())
        .post('/api/v1/tickets')
        .set('Cookie', cookies)
        .send({
          title: 'Ticket Title',
          description: 'Ticket description',
          tag: TicketTag.BUG,
        });

      expect(response.status).toBe(201);

      expect(response.body).toEqual({
        id: response.body.id,
        title: 'Ticket Title',
        description: 'Ticket description',
        status: TicketStatus.OPEN,
        tag: TicketTag.BUG,
        createdBy: createdUser.id,
        createdAt: response.body.createdAt,
        updatedAt: response.body.updatedAt,
      });
    });

    test('Submits with missing required fields', async () => {
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
        .post('/api/v1/tickets')
        .set('Cookie', cookies)
        .send({
          title: 'Ticket Title',
          description: 'Ticket description',
          // missing tag
        });

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        name: 'ValidationError',
        message: 'Aconteceu algum erro de validação.',
        action: 'Verifique os dados enviados e tente novamente.',
        statusCode: 400,
      });
    });

    test('Submits with extra fields in the body', async () => {
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
        .post('/api/v1/tickets')
        .set('Cookie', cookies)
        .send({
          title: 'Ticket Title',
          description: 'Ticket description',
          tag: TicketTag.FEATURE,
          extraField: 'not allowed',
        });

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        name: 'ValidationError',
        message: 'Aconteceu algum erro de validação.',
        action: 'Verifique os dados enviados e tente novamente.',
        statusCode: 400,
      });
    });
  });
});
