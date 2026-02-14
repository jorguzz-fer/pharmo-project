export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 400,
    code: string = 'BAD_REQUEST',
    isOperational: boolean = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, code?: string) {
    return new AppError(message, 400, code || 'BAD_REQUEST');
  }

  static unauthorized(message: string = 'Nao autorizado') {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Acesso negado') {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static notFound(message: string = 'Recurso nao encontrado') {
    return new AppError(message, 404, 'NOT_FOUND');
  }

  static conflict(message: string) {
    return new AppError(message, 409, 'CONFLICT');
  }

  static internal(message: string = 'Erro interno do servidor') {
    return new AppError(message, 500, 'INTERNAL_ERROR', false);
  }
}
