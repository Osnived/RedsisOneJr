import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ApiErrorResponse } from '@redsis/contracts';

/**
 * Traduce cualquier excepción a la forma estable definida en `ApiErrorResponse`.
 *
 * El frontend depende de este contrato, por eso la forma de la respuesta no
 * cambia según el tipo de error. Los errores inesperados se registran completos
 * pero nunca se devuelven al cliente.
 */
/** Umbral a partir del cual el error es del servidor y no del cliente. */
const SERVER_ERROR_STATUS = 500;

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const body: ApiErrorResponse = {
      statusCode: status,
      message: this.resolveMessage(exception, status),
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    const fieldErrors = this.resolveFieldErrors(exception);
    if (fieldErrors) {
      body.errors = fieldErrors;
    }

    if (status >= SERVER_ERROR_STATUS) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(body);
  }

  private resolveMessage(exception: unknown, status: number): string {
    // Los errores del servidor nunca exponen el detalle interno al cliente.
    if (status >= SERVER_ERROR_STATUS) {
      return 'Error interno del servidor';
    }

    if (exception instanceof HttpException) {
      const payload = exception.getResponse();

      if (typeof payload === 'string') {
        return payload;
      }

      if (this.isRecord(payload)) {
        const message = payload['message'];

        if (typeof message === 'string') {
          return message;
        }

        if (Array.isArray(message) && message.length > 0) {
          return 'La solicitud contiene datos inválidos';
        }
      }

      return exception.message;
    }

    return 'Error inesperado';
  }

  /**
   * El ValidationPipe entrega los mensajes como un arreglo plano.
   * Se agrupan bajo la clave `validation` para que el frontend los muestre junto al formulario.
   */
  private resolveFieldErrors(exception: unknown): Record<string, string[]> | undefined {
    if (!(exception instanceof HttpException)) {
      return undefined;
    }

    const payload = exception.getResponse();

    if (!this.isRecord(payload)) {
      return undefined;
    }

    const message = payload['message'];

    if (!Array.isArray(message) || message.length === 0) {
      return undefined;
    }

    return { validation: message.map((entry) => String(entry)) };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
