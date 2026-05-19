import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '@middlewares/error-handler.middleware';

interface TokenPayload {
  id: number;
  email: string;
  role: string;
}

export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('Token not provided', 401);
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default_secret',
    ) as TokenPayload;

    req.user = decoded;

    return next();
  } catch {
    throw new AppError('Invalid token', 401);
  }
};
