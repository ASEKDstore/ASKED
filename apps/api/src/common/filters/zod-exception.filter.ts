import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { ZodError } from 'zod';

@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter {
  catch(exception: ZodError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const errors = exception.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    }));

    response.status(400).json({
      statusCode: 400,
      message: 'Validation failed',
      errors,
    });
  }
}
