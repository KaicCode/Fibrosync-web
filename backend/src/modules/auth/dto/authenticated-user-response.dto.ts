import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class AuthenticatedUserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  fullName!: string;

  @ApiPropertyOptional({ format: 'date-time' })
  birthDate?: Date | null;

  @ApiPropertyOptional()
  gender?: string | null;

  @ApiPropertyOptional()
  heightCm?: number | null;

  @ApiPropertyOptional()
  weightKg?: number | null;

  @ApiPropertyOptional()
  countryCode?: string | null;

  @ApiProperty()
  timezone!: string;

  @ApiProperty({ enum: Role })
  role!: Role;

  @ApiProperty()
  onboardingCompleted!: boolean;

  @ApiPropertyOptional({ format: 'date-time' })
  lastLoginAt?: Date | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
