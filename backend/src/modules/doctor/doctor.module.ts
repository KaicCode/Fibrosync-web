import { Module } from '@nestjs/common';
import { DailyRecordsModule } from '@/modules/daily-records/daily-records.module';
import { ReportsModule } from '@/modules/reports/reports.module';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';

@Module({
  imports: [DailyRecordsModule, ReportsModule],
  controllers: [DoctorController],
  providers: [DoctorService],
  exports: [DoctorService],
})
export class DoctorModule {}
