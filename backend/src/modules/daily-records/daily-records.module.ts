import { Module } from '@nestjs/common';
import { CrisisPredictionModule } from '@/modules/crisis-prediction/crisis-prediction.module';
import { WeatherModule } from '@/modules/weather/weather.module';
import { DailyRecordsController } from './daily-records.controller';
import { DailyRecordsService } from './daily-records.service';

@Module({
  imports: [CrisisPredictionModule, WeatherModule],
  controllers: [DailyRecordsController],
  providers: [DailyRecordsService],
  exports: [DailyRecordsService],
})
export class DailyRecordsModule {}
