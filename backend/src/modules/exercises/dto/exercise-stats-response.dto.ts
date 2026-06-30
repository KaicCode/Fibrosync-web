import { ApiProperty } from '@nestjs/swagger';

// Estatísticas calculadas dinamicamente para o painel do usuário
export class ExerciseStatsResponseDto {
  @ApiProperty({ description: 'Total de sessões concluídas.' })
  totalCompleted!: number;

  @ApiProperty({ description: 'Sequência atual de dias consecutivos com exercício.' })
  currentStreak!: number;

  @ApiProperty({ description: 'Exercícios realizados nos últimos 7 dias.' })
  weeklyCount!: number;

  @ApiProperty({ description: 'Tempo total acumulado em minutos.' })
  totalMinutes!: number;
}
