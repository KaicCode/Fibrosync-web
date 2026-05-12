import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponse } from '@utils/api-response';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.authService.register(req.body);
      res.status(201).json(ApiResponse.success(result, 'User registered successfully', 201));
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.authService.login(req.body);
      res.json(ApiResponse.success(result, 'Login successful'));
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response) {
    res.json(ApiResponse.success(req.user, 'Current user profile'));
  }
}
