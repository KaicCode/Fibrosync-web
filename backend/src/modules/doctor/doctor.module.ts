import { Module } from '@nestjs/common';
import { DailyRecordsModule } from '@/modules/daily-records/daily-records.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { ReportsModule } from '@/modules/reports/reports.module';
import { DoctorPatientLinksController } from './doctor-patient-links.controller';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { PatientProfessionalsController } from './patient-professionals.controller';
import { ProfessionalLinksService } from './professional-links.service';

@Module({
  imports: [DailyRecordsModule, ReportsModule, NotificationsModule],
  controllers: [
    DoctorController,
    DoctorPatientLinksController,
    PatientProfessionalsController,
  ],
  providers: [DoctorService, ProfessionalLinksService],
  exports: [DoctorService, ProfessionalLinksService],
})
export class DoctorModule {}
