export class InternalServerError extends Error {
  action: string;
  statusCode: number;

  constructor({ cause, statusCode }: { cause: Error; statusCode?: number }) {
    super('Aconteceu um erro inesperado no servidor.', {
      cause,
    });
    this.name = 'InternalServerError';
    this.action = 'Entre em contato com o suporte.';
    this.statusCode = statusCode || 500;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
    };
  }
}

export class NotFoundError extends Error {
  action: string;
  statusCode: number;

  constructor({
    cause,
    message,
    action,
  }: {
    cause?: Error;
    message?: string;
    action?: string;
  }) {
    super(message || 'O recurso solicitado não foi encontrado no sistema.', {
      cause,
    });
    this.name = 'NotFoundError';
    this.action =
      action || 'Verifique se os parâmetros da consulta estão corretos.';
    this.statusCode = 404;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
    };
  }
}

export class UnauthorizedError extends Error {
  action: string;
  statusCode: number;

  constructor({
    cause,
    message,
    action,
  }: {
    cause?: Error;
    message?: string;
    action?: string;
  }) {
    super(message || 'Usuário não autenticado.', {
      cause,
    });
    this.name = 'UnauthorizedError';
    this.action = action || 'Faça o login para continuar.';
    this.statusCode = 401;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
    };
  }
}

export class ValidationError extends Error {
  action: string;
  statusCode: number;

  constructor({
    cause,
    message,
    action,
  }: {
    cause?: Error;
    message?: string;
    action?: string;
  }) {
    super(message || 'Ocorreu algum erro de validação.', {
      cause,
    });
    this.name = 'ValidationError';
    this.action = action || 'Ajuste os dados enviados e tente novamente.';
    this.statusCode = 400;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
    };
  }
}

export class ServiceError extends Error {
  action: string;
  statusCode: number;

  constructor({ cause, message }: { cause: Error; message?: string }) {
    super(message || 'Serviço indisponível no momento.', {
      cause,
    });
    this.name = 'ServiceError';
    this.action = 'Verifique se o serviço está disponível.';
    this.statusCode = 503;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
    };
  }
}

export class MethodNotAllowedError extends Error {
  action: string;
  statusCode: number;

  constructor() {
    super('Método não permitido para este endpoint.');
    this.name = 'MethodNotAllowedError';
    this.action =
      'Verifique se o método HTTP enviado é válido para este endpoint.';
    this.statusCode = 405;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
    };
  }
}

export class ForbiddenError extends Error {
  action: string;
  statusCode: number;

  constructor({
    cause,
    message,
    action,
  }: {
    cause?: Error;
    message?: string;
    action?: string;
  }) {
    super(message || 'Você não tem permissão para acessar este recurso.', {
      cause,
    });
    this.name = 'ForbiddenError';
    this.action =
      action ||
      'Verifique se sua conta possui as permissões necessárias para realizar esta ação.';
    this.statusCode = 403;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
    };
  }
}
