import { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler.middleware';

export const rolesMiddleware = (allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError('Forbidden: Access denied', 403);
    }

    next();
  };
};
