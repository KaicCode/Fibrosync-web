import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@utils/api-response';
import Logger from '@utils/logger';

export class AppError extends Error {
  public statusCode: number;
  public errors: any;

  constructor(message: string, statusCode: number = 400, errors: any = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';
  const errors = err instanceof AppError ? err.errors : null;

  Logger.error(`[Error] ${req.method} ${req.path} - ${message}`);
  if (statusCode === 500) {
    Logger.error(err.stack || err);
  }

  res.status(statusCode).json(ApiResponse.error(message, statusCode, errors));
};
