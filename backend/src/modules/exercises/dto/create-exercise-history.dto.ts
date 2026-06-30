import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

// Payload enviado pelo frontend ao concluir um exercício
export class CreateExerciseHistoryDto {
  @ApiProperty({ description: 'ID do exercício concluído.' })
  @IsUUID()
  exerciseId!: string;

  // Duração real em minutos (pode diferir da estimada)
  @ApiPropertyOptional({ description: 'Duração real em minutos.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(300)
  durationPerformed?: number;

  // Como o usuário avaliou a dificuldade: VERY_EASY | EASY | NORMAL | HARD | VERY_HARD
  @ApiPropertyOptional({ description: 'Dificuldade percebida pelo usuário.' })
  @IsOptional()
  @IsString()
  difficultyReported?: string;

  @ApiPropertyOptional({ description: 'Observações livres sobre a sessão.' })
  @IsOptional()
  @IsString()
  notes?: string;
}
