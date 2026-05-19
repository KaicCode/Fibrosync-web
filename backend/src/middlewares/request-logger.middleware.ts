import { Request, Response, NextFunction } from 'express';
import Logger from '@utils/logger';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    Logger.http(`${method} ${originalUrl} ${statusCode} - ${duration}ms`);
  });

  next();
};
