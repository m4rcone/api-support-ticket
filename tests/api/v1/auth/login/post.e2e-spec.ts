import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import request from 'supertest';
import { HttpErrorHandler } from '../../../../../src/infra/http-error-handler';
import { AppModule } from '../../../../../src/app.module';
import {
  clearDatabase,
  closeTestDatabasePool,
} from '../../../../utils/orchestrator';

describe('POST /api/v1/auth/login', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

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
    await clearDatabase();
  });

  afterAll(async () => {
    await closeTestDatabasePool();
    await app.close();
  });

  describe('Anonymous user', () => {
    test("With correct 'email' and correct 'password'", async () => {
      await request(app.getHttpServer()).post('/api/v1/users').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securepassword',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'john@example.com',
          password: 'securepassword',
        });

      expect(response.status).toBe(200);

      const setCookie = response.headers['set-cookie'];

      expect(setCookie).toBeDefined();
      expect(setCookie[0]).toContain('accessToken=');
      expect(setCookie[0]).toContain('HttpOnly');
      expect(setCookie[0]).toContain('Path=/');
      expect(setCookie[0]).toContain('Max-Age=');
      expect(setCookie[0]).toContain('SameSite=Lax');
    });

    test("With correct 'email' but incorrect 'password'", async () => {
      await request(app.getHttpServer()).post('/api/v1/users').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securepassword',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'john@example.com',
          password: 'incorrectpassword',
        });

      expect(response.status).toBe(401);

      expect(response.body).toEqual({
        name: 'UnauthorizedError',
        message: 'Os dados de autenticação não conferem.',
        action: 'Verifique se os dados enviados estão corretos.',
        statusCode: 401,
      });
    });

    test("With correct 'password' but incorrect 'email'", async () => {
      await request(app.getHttpServer()).post('/api/v1/users').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securepassword',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'incorrect@example.com',
          password: 'securepassword',
        });

      expect(response.status).toBe(401);

      expect(response.body).toEqual({
        name: 'UnauthorizedError',
        message: 'Os dados de autenticação não conferem.',
        action: 'Verifique se os dados enviados estão corretos.',
        statusCode: 401,
      });
    });

    test("With incorrect 'email' and incorrect 'password'", async () => {
      await request(app.getHttpServer()).post('/api/v1/users').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securepassword',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'incorrect@example.com',
          password: 'incorrectpassword',
        });

      expect(response.status).toBe(401);

      expect(response.body).toEqual({
        name: 'UnauthorizedError',
        message: 'Os dados de autenticação não conferem.',
        action: 'Verifique se os dados enviados estão corretos.',
        statusCode: 401,
      });
    });

    test('With missing data', async () => {
      await request(app.getHttpServer()).post('/api/v1/users').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securepassword',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'john@example.com',
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
