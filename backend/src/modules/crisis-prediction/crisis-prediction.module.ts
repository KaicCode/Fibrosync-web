import { Module } from '@nestjs/common';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { SystemSettingsModule } from '@/modules/system-settings/system-settings.module';
import { WeatherModule } from '@/modules/weather/weather.module';
import { CrisisPredictionController } from './crisis-prediction.controller';
import { CrisisPredictionService } from './crisis-prediction.service';

@Module({
  imports: [NotificationsModule, WeatherModule, SystemSettingsModule],
  controllers: [CrisisPredictionController],
  providers: [CrisisPredictionService],
  exports: [CrisisPredictionService],
})
export class CrisisPredictionModule {}
