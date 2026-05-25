import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { GenerateReportDto } from './dto/generate-report.dto';
import { ReportListResponseDto } from './dto/report-list-response.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportResponseDto } from './dto/report-response.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('generate')
  @ApiOperation({
    summary:
      'Generates a structured weekly, monthly or quarterly report in JSON format.',
  })
  @ApiOkResponse({ type: ReportResponseDto })
  generate(
    @CurrentUser('sub') userId: string,
    @Query() dto: GenerateReportDto,
  ): Promise<ReportResponseDto> {
    return this.reportsService.generate(userId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lists previously generated reports for the authenticated user.',
  })
  @ApiOkResponse({ type: ReportListResponseDto })
  list(
    @CurrentUser('sub') userId: string,
    @Query() query: ReportQueryDto,
  ): Promise<ReportListResponseDto> {
    return this.reportsService.listForUser(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Returns a previously generated report.' })
  @ApiOkResponse({ type: ReportResponseDto })
  @ApiNotFoundResponse({ description: 'Report not found.' })
  findOne(
    @CurrentUser('sub') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ReportResponseDto> {
    return this.reportsService.findOneForUser(userId, id);
  }
}
