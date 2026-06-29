import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    // switchToHttp() gives us the HTTP-specific context (request + response)
    const ctx = host.switchToHttp();

    // In Fastify, response is FastifyReply (not Express's Response)
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const statusCode = exception.getStatus();

    // getResponse() can return a string OR an object
    // NestJS built-in exceptions return: { message, error, statusCode }
    const exceptionResponse = exception.getResponse();

    // Normalize the message — handle both string and object responses
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as Record<string, unknown>).message;

    const error =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as Record<string, unknown>).error;

    // Log for debugging (we'll replace console.log with a proper logger later)
    console.log(
      `[HttpException] ${request.method} ${request.url} - ${statusCode}`,
    );

    // Send standardized error response
    response.status(statusCode).send({
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
