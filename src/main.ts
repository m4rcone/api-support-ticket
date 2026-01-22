import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { HttpErrorHandler } from './infra/http-error-handler';

async function bootstrap() {
  const port = process.env.PORT ?? 3000;
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  app.useGlobalFilters(new HttpErrorHandler());

  await app.listen(port, () => {
    Logger.log(`Application running on port ${port}`);
  });
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
