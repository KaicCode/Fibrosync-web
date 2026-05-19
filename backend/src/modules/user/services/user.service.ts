import prisma from '@config/database';

export class UserService {
  async findAll() {
    return await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        birthDate: true,
        gender: true,
        height: true,
        weight: true,
        country: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
