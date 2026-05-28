import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class SymptomSignalInputDto {
  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  stiffness?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  cognitiveFog?: boolean;

  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  cognitiveFogLevel?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sensitivityLight?: boolean;

  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  sensitivityLightLevel?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sensitivityNoise?: boolean;

  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  sensitivityNoiseLevel?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  digestiveIssues?: boolean;

  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  digestiveIssuesLevel?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  headache?: boolean;

  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  headacheLevel?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  anxiety?: boolean;

  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  anxietyLevel?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  depression?: boolean;

  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  depressionLevel?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  bodyTemperatureFeeling?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
