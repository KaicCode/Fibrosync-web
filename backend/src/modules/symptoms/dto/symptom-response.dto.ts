import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SymptomResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fatigueLevel!: number;

  @ApiProperty()
  sleepQuality!: number;

  @ApiProperty()
  stiffness!: number;

  @ApiProperty()
  mood!: number;

  @ApiProperty()
  stress!: number;

  @ApiProperty()
  cognitiveFog!: boolean;

  @ApiProperty()
  sensitivityLight!: boolean;

  @ApiProperty()
  sensitivityNoise!: boolean;

  @ApiProperty()
  digestiveIssues!: boolean;

  @ApiProperty()
  headache!: boolean;

  @ApiProperty()
  anxiety!: boolean;

  @ApiProperty()
  depression!: boolean;

  @ApiPropertyOptional()
  bodyTemperatureFeeling?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
