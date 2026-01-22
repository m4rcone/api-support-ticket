import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

type ErrorResponse = {
  name: string;
  message: string;
  action: string;
  statusCode: number;
  details?: unknown;
};

@Catch()
export class HttpErrorHandler implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    let body: ErrorResponse = {
      name: 'InternalServerError',
      message: 'Aconteceu um erro inesperado no servidor.',
      action:
        'Tente novamente mais tarde. Se o problema persistir, contate o suporte.',
      statusCode: status,
    };

    if (exception instanceof BadRequestException) {
      status = exception.getStatus();
      // const res = exception.getResponse() as any;

      body = {
        name: 'ValidationError',
        message: 'Aconteceu algum erro de validação.',
        action: 'Verifique os dados enviados e tente novamente.',
        statusCode: status,
        // opcional: manda as mensagens originais do class-validator
        // details: Array.isArray(res?.message) ? res.message : res,
      };
    }

    response.status(status).json(body);
  }
}
