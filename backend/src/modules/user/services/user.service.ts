import prisma from '@config/database';

export class UserService {
  async findAll() {
    return await prisma.user.findMany();
  }
}
