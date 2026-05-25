import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ReportPeriod } from '../enums/report-period.enum';

export class GenerateReportDto {
  @ApiPropertyOptional({
    enum: ReportPeriod,
    default: ReportPeriod.MONTHLY,
  })
  @IsOptional()
  @IsEnum(ReportPeriod)
  period: ReportPeriod = ReportPeriod.MONTHLY;
}
