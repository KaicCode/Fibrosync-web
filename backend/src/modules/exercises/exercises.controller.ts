import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CreateExerciseHistoryDto } from './dto/create-exercise-history.dto';
import { ExerciseHistoryListResponseDto, ExerciseHistoryResponseDto } from './dto/exercise-history-response.dto';
import { ExerciseListResponseDto, ExerciseResponseDto } from './dto/exercise-response.dto';
import { ExerciseStatsResponseDto } from './dto/exercise-stats-response.dto';
import { ExerciseQueryDto } from './dto/exercise-query.dto';
import { ExercisesService } from './exercises.service';

@ApiTags('Exercises')
@ApiBearerAuth('access-token')
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  // ─── Catálogo de exercícios ───────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Lista exercícios ativos com filtros opcionais.' })
  @ApiOkResponse({ type: ExerciseListResponseDto })
  list(@Query() query: ExerciseQueryDto): Promise<unknown> {
    return this.exercisesService.listExercises(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Retorna estatísticas de exercícios do usuário.' })
  @ApiOkResponse({ type: ExerciseStatsResponseDto })
  stats(@CurrentUser('sub') userId: string): Promise<unknown> {
    return this.exercisesService.getStats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retorna um exercício pelo id.' })
  @ApiOkResponse({ type: ExerciseResponseDto })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<unknown> {
    return this.exercisesService.findExerciseById(id);
  }

  // ─── Histórico do usuário ─────────────────────────────────────────────────

  @Get('history/me')
  @ApiOperation({ summary: 'Lista o histórico de exercícios do usuário autenticado.' })
  @ApiOkResponse({ type: ExerciseHistoryListResponseDto })
  listHistory(@CurrentUser('sub') userId: string): Promise<unknown> {
    return this.exercisesService.listHistory(userId);
  }

  @Post('history')
  @ApiOperation({ summary: 'Registra um exercício concluído.' })
  @ApiCreatedResponse({ type: ExerciseHistoryResponseDto })
  createHistory(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateExerciseHistoryDto,
  ): Promise<unknown> {
    return this.exercisesService.createHistory(userId, dto);
  }
}
