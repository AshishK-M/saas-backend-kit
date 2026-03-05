import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

export class ResponseHelper {
  static success<T>(res: Response, data?: T, message?: string, statusCode: number = 200): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data?: T, message: string = 'Resource created'): Response {
    return this.success(res, data, message, 201);
  }

  static updated<T>(res: Response, data?: T, message: string = 'Resource updated'): Response {
    return this.success(res, data, message, 200);
  }

  static deleted(res: Response, message: string = 'Resource deleted'): Response {
    return this.success(res, null, message, 200);
  }

  static error(
    res: Response,
    error: string,
    statusCode: number = 400,
    code?: string,
    details?: Record<string, unknown>
  ): Response {
    const response: ErrorResponse = {
      success: false,
      error,
      code,
      ...(details && { details }),
    };
    return res.status(statusCode).json(response);
  }

  static badRequest(res: Response, error: string = 'Bad request', code?: string): Response {
    return this.error(res, error, 400, code);
  }

  static unauthorized(res: Response, error: string = 'Unauthorized', code?: string): Response {
    return this.error(res, error, 401, code);
  }

  static forbidden(res: Response, error: string = 'Forbidden', code?: string): Response {
    return this.error(res, error, 403, code);
  }

  static notFound(res: Response, error: string = 'Resource not found', code?: string): Response {
    return this.error(res, error, 404, code);
  }

  static conflict(res: Response, error: string = 'Conflict', code?: string): Response {
    return this.error(res, error, 409, code);
  }

  static validationError(res: Response, error: string, details?: Record<string, unknown>): Response {
    return this.error(res, error, 422, 'VALIDATION_ERROR', details);
  }

  static internalError(res: Response, error: string = 'Internal server error'): Response {
    return this.error(res, error, 500, 'INTERNAL_ERROR');
  }

  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number
  ): Response<PaginatedResponse<T>> {
    const totalPages = Math.ceil(total / limit);
    const response: PaginatedResponse<T> = {
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
    return res.status(200).json(response);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}

declare global {
  namespace Express {
    interface Response {
      success<T>(data?: T, message?: string, statusCode?: number): Response;
      created<T>(data?: T, message?: string): Response;
      updated<T>(data?: T, message?: string): Response;
      deleted(message?: string): Response;
      error(error: string, statusCode?: number, code?: string, details?: Record<string, unknown>): Response;
      badRequest(error?: string, code?: string): Response;
      unauthorized(error?: string, code?: string): Response;
      forbidden(error?: string, code?: string): Response;
      notFound(error?: string, code?: string): Response;
      conflict(error?: string, code?: string): Response;
      validationError(error: string, details?: Record<string, unknown>): Response;
      internalError(error?: string): Response;
      paginated<T>(data: T[], page: number, limit: number, total: number): Response;
    }
  }
}

Response.prototype.success = function <T>(data?: T, message?: string, statusCode: number = 200) {
  return ResponseHelper.success(this, data, message, statusCode);
};

Response.prototype.created = function <T>(data?: T, message?: string) {
  return ResponseHelper.created(this, data, message);
};

Response.prototype.updated = function <T>(data?: T, message?: string) {
  return ResponseHelper.updated(this, data, message);
};

Response.prototype.deleted = function (message?: string) {
  return ResponseHelper.deleted(this, message);
};

Response.prototype.error = function (error: string, statusCode: number = 400, code?: string, details?: Record<string, unknown>) {
  return ResponseHelper.error(this, error, statusCode, code, details);
};

Response.prototype.badRequest = function (error?: string, code?: string) {
  return ResponseHelper.badRequest(this, error, code);
};

Response.prototype.unauthorized = function (error?: string, code?: string) {
  return ResponseHelper.unauthorized(this, error, code);
};

Response.prototype.forbidden = function (error?: string, code?: string) {
  return ResponseHelper.forbidden(this, error, code);
};

Response.prototype.notFound = function (error?: string, code?: string) {
  return ResponseHelper.notFound(this, error, code);
};

Response.prototype.conflict = function (error?: string, code?: string) {
  return ResponseHelper.conflict(this, error, code);
};

Response.prototype.validationError = function (error: string, details?: Record<string, unknown>) {
  return ResponseHelper.validationError(this, error, details);
};

Response.prototype.internalError = function (error?: string) {
  return ResponseHelper.internalError(this, error);
};

Response.prototype.paginated = function <T>(data: T[], page: number, limit: number, total: number) {
  return ResponseHelper.paginated(this, data, page, limit, total);
};

export const response = ResponseHelper;
export default ResponseHelper;
