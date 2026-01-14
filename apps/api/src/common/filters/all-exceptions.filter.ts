import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extract error message and stack safely
    let errorMessage = 'Internal server error';
    let errorStack: string | undefined;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        errorMessage = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as { message?: string | string[]; error?: string };
        errorMessage = Array.isArray(responseObj.message)
          ? responseObj.message.join(', ')
          : responseObj.message || responseObj.error || errorMessage;
      }
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
      errorStack = exception.stack;
    }

    if (status >= 500) {
      // Log full stack for server errors
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${errorMessage}`,
        errorStack,
        'AllExceptionsFilter',
      );
    } else {
      // Log warnings for client errors (4xx)
      this.logger.warn(`${request.method} ${request.url} - ${status} - ${errorMessage}`);
    }

    // Sanitize error response for production (don't leak stack traces)
    const errorResponse: {
      statusCode: number;
      message: string;
      error?: string;
      timestamp: string;
      path: string;
    } = {
      statusCode: status,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Only include error field for 4xx errors (client errors)
    if (status < 500 && exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as { error?: string };
        if (responseObj.error) {
          errorResponse.error = responseObj.error;
        }
      }
    }

    response.status(status).json(errorResponse);
  }
}

