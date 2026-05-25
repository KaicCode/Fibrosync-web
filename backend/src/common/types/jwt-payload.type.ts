import type { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  tokenId?: string;
}

export type AuthenticatedUser = JwtPayload;
