import { Module } from '@nestjs/common';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PatternAnalysisService } from './pattern-analysis.service';
import { PatternScoreEngine } from './pattern-score.engine';
import { GeminiAiPredictionProvider } from './prediction-providers/gemini-ai-prediction.provider';
import { AI_PREDICTION_PROVIDER } from './prediction-providers/ai-prediction-provider.token';

@Module({
  imports: [NotificationsModule],
  controllers: [AiController],
  providers: [
    AiService,
    PatternAnalysisService,
    PatternScoreEngine,
    GeminiAiPredictionProvider,
    {
      provide: AI_PREDICTION_PROVIDER,
      useExisting: GeminiAiPredictionProvider,
    },
  ],
})
export class AiModule {}
