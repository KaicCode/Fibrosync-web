import prisma from '@config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppError } from '@middlewares/error-handler.middleware';
import { LoginDto, RegisterDto } from '../dtos/auth.dto';
import { Prisma } from '@generated/prisma';

export class AuthService {
  async register(data: RegisterDto) {
    if (!data.name?.trim()) {
      throw new AppError('Name is required', 400);
    }

    if (!data.email?.trim()) {
      throw new AppError('Email is required', 400);
    }

    if (!data.password?.trim()) {
      throw new AppError('Password is required', 400);
    }

    const normalizedEmail = data.email.trim().toLowerCase();

    const userExists = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (userExists) {
      throw new AppError('User already exists', 400);
    }

    if (data.birthDate && Number.isNaN(new Date(data.birthDate).getTime())) {
      throw new AppError('Birth date is invalid', 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        gender: data.gender?.trim() || undefined,
        height:
          typeof data.height === 'number'
            ? new Prisma.Decimal(data.height)
            : undefined,
        weight:
          typeof data.weight === 'number'
            ? new Prisma.Decimal(data.weight)
            : undefined,
        country: data.country?.trim() || 'Brasil',
      },
    });

    return this.generateToken(user);
  }

  async login(data: LoginDto) {
    if (!data.email?.trim() || !data.password?.trim()) {
      throw new AppError('Email and password are required', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: data.email.trim().toLowerCase() },
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
        birthDate: user.birthDate,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        country: user.country,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  }
}
