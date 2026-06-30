import { ApiPropertyOptional } from '@nestjs/swagger';
import { ExerciseCategory, ExerciseDifficulty } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

// Filtros disponíveis para a listagem de exercícios
export class ExerciseQueryDto {
  @ApiPropertyOptional({ enum: ExerciseCategory })
  @IsOptional()
  @IsEnum(ExerciseCategory)
  category?: ExerciseCategory;

  @ApiPropertyOptional({ enum: ExerciseDifficulty })
  @IsOptional()
  @IsEnum(ExerciseDifficulty)
  difficulty?: ExerciseDifficulty;
}
