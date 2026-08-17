import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = this.normalize(exception, status);
      const isServerError = status >= 500;
      if (isServerError) {
        this.logger.error(exception.message, exception.stack);
      }
      response.status(status).json(body);
      return;
    }

    this.logger.error(
      (exception as Error)?.message ?? 'Unhandled exception',
      (exception as Error)?.stack,
    );
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
  }

  private normalize(exception: HttpException, status: number): ErrorBody {
    const body = exception.getResponse();
    if (typeof body === 'object' && body !== null && 'message' in body) {
      const typed = body as Partial<ErrorBody>;
      return {
        statusCode: status,
        message: typed.message as string | string[],
        error: typed.error ?? statusPhrase(status),
      };
    }
    return {
      statusCode: status,
      message: typeof body === 'string' ? body : exception.message,
      error: statusPhrase(status),
    };
  }
}

function statusPhrase(status: number): string {
  const key = HttpStatus[status];
  if (!key) return 'Error';
  return key
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
