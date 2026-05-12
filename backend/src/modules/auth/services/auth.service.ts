import prisma from '@config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppError } from '@middlewares/error-handler.middleware';
import { LoginDto, RegisterDto } from '../dtos/auth.dto';

export class AuthService {
  async register(data: RegisterDto) {
    console.log('Registering user with data:', JSON.stringify(data, null, 2));
    const userExists = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (userExists) {
      throw new AppError('User already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });

    return this.generateToken(user);
  }

  async login(data: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const passwordMatch = await bcrypt.compare(data.password, user.password);

    if (!passwordMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    return this.generateToken(user);
  }

  private generateToken(user: any) {
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '1d' },
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }
}
