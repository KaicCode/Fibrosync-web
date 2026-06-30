import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExerciseCategory } from '@prisma/client';

// Shape da resposta de um registro de histórico
export class ExerciseHistoryResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() completedAt!: Date;
  @ApiPropertyOptional() durationPerformed!: number | null;
  @ApiPropertyOptional() difficultyReported!: string | null;
  @ApiPropertyOptional() notes!: string | null;
  @ApiProperty() createdAt!: Date;

  @ApiProperty()
  exercise!: {
    id: string;
    title: string;
    category: ExerciseCategory;
    durationMinutes: number;
    imageUrl: string | null;
  };
}

export class ExerciseHistoryListResponseDto {
  @ApiProperty({ type: [ExerciseHistoryResponseDto] })
  items!: ExerciseHistoryResponseDto[];
}
