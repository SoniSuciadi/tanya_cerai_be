import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ErrorUniqueConstraint } from './handleErrorUniqueConstraint.interceptor';
import { OrderNotFoundError } from './handleErrorOrderNotFound.interceptor';

export interface ErrorResponse {
  name: string;
  message: string;
  statusCode: number;
  code?: string;
  table?: string;
  column?: string;
  detail?: string;
  query?: string;
  constraint?: string;
}

@Catch()
export class HandleError implements ExceptionFilter {
  catch(exception, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const resError: ErrorResponse = {
      name: 'Internal Server Error',
      message: 'Internal Server Error',
      statusCode: 500,
    };

    if (exception instanceof OrderNotFoundError) {
      resError.name = 'NotFoundError';
      resError.message = exception.message;
      resError.statusCode = exception.statusCode;
      resError.detail = exception.details;
    } else if (exception instanceof ErrorUniqueConstraint) {
      resError.name = 'NotFoundError';
      resError.message = exception.message;
      resError.statusCode = exception.statusCode;
      resError.detail = exception.details;
    }

    response.status(resError.statusCode).json(resError);
  }
}
