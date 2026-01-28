import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { HttpErrorHandler } from './infra/http/http-error-handler';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const port = process.env.PORT ?? 3000;
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new HttpErrorHandler());

  const config = new DocumentBuilder()
    .setTitle('Support Ticket API')
    .setDescription(
      'MVP de API de suporte com autenticação/autorização, tickets, comentários e histórico de status.',
    )
    .setVersion('1.0.0')
    .addCookieAuth('accessToken')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('', app, document);

  await app.listen(port, () => {
    Logger.log(
      `Application running on port http://localhost:${port}`,
      'NestApplication',
    );
  });
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
