import { Module } from '@nestjs/common';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { WeatherModule } from '@/modules/weather/weather.module';
import { CrisisPredictionController } from './crisis-prediction.controller';
import { CrisisPredictionService } from './crisis-prediction.service';

@Module({
  imports: [NotificationsModule, WeatherModule],
  controllers: [CrisisPredictionController],
  providers: [CrisisPredictionService],
  exports: [CrisisPredictionService],
})
export class CrisisPredictionModule {}
