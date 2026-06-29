import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FastifyReply, FastifyRequest } from 'fastify';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // BEFORE the route handler runs
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const { method, url } = request;
    const startTime = Date.now();

    console.log(`[Incoming] ${method} ${url}`);

    // next.handle() calls the actual route handler
    // It returns an Observable — the response flows through here
    return next.handle().pipe(
      // tap() runs a side effect WITHOUT modifying the response
      tap(() => {
        const response = context.switchToHttp().getResponse<FastifyReply>();
        const duration = Date.now() - startTime;
        console.log(
          `[Outgoing] ${method} ${url} - ${response.statusCode} +${duration}ms`,
        );
      }),
    );
  }
}
