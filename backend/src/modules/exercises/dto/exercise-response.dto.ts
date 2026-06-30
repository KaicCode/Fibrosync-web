import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExerciseCategory, ExerciseDifficulty } from '@prisma/client';

// Shape de resposta de um exercício individual
export class ExerciseResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() description!: string;
  @ApiPropertyOptional() imageUrl!: string | null;
  @ApiProperty({ enum: ExerciseCategory }) category!: ExerciseCategory;
  @ApiProperty({ enum: ExerciseDifficulty }) difficulty!: ExerciseDifficulty;
  @ApiProperty() durationMinutes!: number;
  @ApiProperty({ type: [String] }) instructions!: string[];
  @ApiProperty({ type: [String] }) benefits!: string[];
  @ApiProperty({ type: [String] }) precautions!: string[];
  @ApiProperty() isActive!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class ExerciseListResponseDto {
  @ApiProperty({ type: [ExerciseResponseDto] })
  items!: ExerciseResponseDto[];
}
