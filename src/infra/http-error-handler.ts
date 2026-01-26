import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ForbiddenError,
  InternalServerError,
  UnauthorizedError,
  ValidationError,
} from './errors';
import { NotFoundError } from '../infra/errors';

type ErrorResponse = {
  name: string;
  message: string;
  action: string;
  statusCode: number;
};

@Catch()
export class HttpErrorHandler implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorHandler.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: number;
    let body: ErrorResponse;

    if (exception instanceof BadRequestException) {
      const validationError = new ValidationError({
        message: 'Aconteceu algum erro de validação.',
        action: 'Verifique os dados enviados e tente novamente.',
      });

      status = exception.getStatus();
      body = validationError.toJSON();

      return response.status(status).json(body);
    }

    if (exception instanceof NotFoundException) {
      const notFoundError = new NotFoundError({
        message: 'O recurso solicitado não foi encontrado.',
        action: 'Verifique o recurso solicitado e tente novamente.',
      });

      status = exception.getStatus();
      body = notFoundError.toJSON();

      return response.status(status).json(body);
    }

    if (exception instanceof UnauthorizedException) {
      const unauthorizedError = new UnauthorizedError({});

      status = exception.getStatus();
      body = unauthorizedError.toJSON();

      return response.status(status).json(body);
    }

    if (exception instanceof ValidationError) {
      status = exception.statusCode;
      body = exception.toJSON();

      return response.status(status).json(body);
    }

    if (exception instanceof UnauthorizedError) {
      status = exception.statusCode;
      body = exception.toJSON();

      return response.status(status).json(body);
    }

    if (exception instanceof ForbiddenError) {
      status = exception.statusCode;
      body = exception.toJSON();

      return response.status(status).json(body);
    }

    if (exception instanceof NotFoundError) {
      status = exception.statusCode;
      body = exception.toJSON();

      return response.status(status).json(body);
    }

    const publicErrorObject = new InternalServerError({
      cause: exception as Error,
    });

    this.logger.error(publicErrorObject.message, publicErrorObject.cause);

    status = HttpStatus.INTERNAL_SERVER_ERROR;
    body = publicErrorObject.toJSON();

    return response.status(status).json(body);
  }
}
