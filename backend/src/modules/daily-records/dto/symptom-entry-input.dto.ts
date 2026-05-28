import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { SymptomCategory } from '@prisma/client';

export class SymptomEntryInputDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  symptomId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  symptomName?: string;

  @ApiPropertyOptional({ enum: SymptomCategory })
  @IsOptional()
  @IsEnum(SymptomCategory)
  category?: SymptomCategory;

  @ApiProperty({ minimum: 0, maximum: 10 })
  @IsInt()
  @Min(0)
  @Max(10)
  severity!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1440)
  durationMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}
