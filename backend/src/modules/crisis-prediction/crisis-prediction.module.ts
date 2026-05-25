import { Module } from '@nestjs/common';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { CrisisPredictionController } from './crisis-prediction.controller';
import { CrisisPredictionService } from './crisis-prediction.service';

@Module({
  imports: [NotificationsModule],
  controllers: [CrisisPredictionController],
  providers: [CrisisPredictionService],
  exports: [CrisisPredictionService],
})
export class CrisisPredictionModule {}
