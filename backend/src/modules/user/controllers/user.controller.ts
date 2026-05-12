import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { ApiResponse } from '@utils/api-response';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await this.userService.findAll();
      res.json(ApiResponse.success(users, 'Users retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }
}
