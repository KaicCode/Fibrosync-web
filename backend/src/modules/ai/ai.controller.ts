import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AiService } from './ai.service';
import { AiPredictionResponseDto } from './dto/ai-prediction-response.dto';
import { AiInsightQueryDto } from './dto/ai-insight-query.dto';
import { AnalyzePatternsDto } from './dto/analyze-patterns.dto';
import { GenerateAiInsightDto } from './dto/generate-ai-insight.dto';
import { PredictAiDto } from './dto/predict-ai.dto';
import { UserRiskProfileResponseDto } from './dto/user-risk-profile-response.dto';
import { PatternAnalysisService } from './pattern-analysis.service';

@ApiTags('AI')
@ApiBearerAuth('access-token')
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly patternAnalysisService: PatternAnalysisService,
  ) {}

  @Post('predict')
  @ApiOperation({
    summary:
      'Analyzes the authenticated user context and predicts fibromyalgia crisis risk using Gemini.',
  })
  @ApiCreatedResponse({ type: AiPredictionResponseDto })
  @ApiNotFoundResponse({
    description:
      'Not enough daily records or symptom signals are available for AI prediction.',
  })
  @ApiServiceUnavailableResponse({
    description:
      'Gemini prediction failed or is not configured for the current environment.',
  })
  predict(
    @CurrentUser('sub') userId: string,
    @Body() dto: PredictAiDto,
  ): Promise<AiPredictionResponseDto> {
    return this.aiService.predict(userId, dto);
  }

  @Post('pattern-analysis')
  @ApiOperation({
    summary:
      'Analyzes the last 30 days of behavior and builds a personalized risk profile without training a custom model.',
  })
  @ApiCreatedResponse({ type: UserRiskProfileResponseDto })
  @ApiNotFoundResponse({
    description:
      'Not enough historical data is available to build a personalized risk profile.',
  })
  analyzePatterns(
    @CurrentUser('sub') userId: string,
    @Body() dto: AnalyzePatternsDto,
  ): Promise<UserRiskProfileResponseDto> {
    return this.patternAnalysisService.analyzeFromDto(userId, dto);
  }

  @Get('risk-profile')
  @ApiOperation({
    summary: 'Returns the latest personalized pseudo-learning risk profile.',
  })
  @ApiOkResponse({ type: UserRiskProfileResponseDto })
  @ApiNotFoundResponse({
    description:
      'No personalized risk profile was generated for this user yet.',
  })
  getRiskProfile(
    @CurrentUser('sub') userId: string,
  ): Promise<UserRiskProfileResponseDto> {
    return this.patternAnalysisService.getLatestProfileForUser(userId);
  }

  @Post('insights')
  @ApiOperation({
    summary: 'Generates an AI insight from recent patient data.',
  })
  generateInsight(
    @CurrentUser('sub') userId: string,
    @Body() dto: GenerateAiInsightDto,
  ): Promise<unknown> {
    return this.aiService.generateInsight(userId, dto);
  }

  @Get('insights')
  @ApiOperation({
    summary: 'Lists stored AI insights for the authenticated user.',
  })
  listInsights(
    @CurrentUser('sub') userId: string,
    @Query() query: AiInsightQueryDto,
  ): Promise<unknown> {
    return this.aiService.listForUser(userId, query);
  }
}
