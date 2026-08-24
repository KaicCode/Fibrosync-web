import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Body,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import type { DailyRecordQueryDto } from '@/modules/daily-records/dto/daily-record-query.dto';
import type { GenerateReportDto } from '@/modules/reports/dto/generate-report.dto';
import type { ReportQueryDto } from '@/modules/reports/dto/report-query.dto';
import { CreateDoctorPatientAccessDto } from './dto/create-doctor-patient-access.dto';
import { CreateDoctorNoteDto } from './dto/create-doctor-note.dto';
import { DoctorDashboardQueryDto } from './dto/doctor-dashboard-query.dto';
import { DoctorNotesQueryDto } from './dto/doctor-notes-query.dto';
import { DoctorPatientsQueryDto } from './dto/doctor-patients-query.dto';
import { UpdateDoctorNoteDto } from './dto/update-doctor-note.dto';
import { DoctorService } from './doctor.service';

@ApiTags('Doctor')
@ApiBearerAuth('access-token')
@Roles(Role.MEDICAL, Role.ADMIN)
@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Returns the doctor dashboard.' })
  getDashboard(
    @CurrentUser('sub') doctorId: string,
    @Query() query: DoctorDashboardQueryDto,
  ): Promise<unknown> {
    return this.doctorService.getDashboard(doctorId, query);
  }

  @Get('patients')
  @ApiOperation({ summary: 'Lists patients linked to the doctor.' })
  listPatients(
    @CurrentUser('sub') doctorId: string,
    @Query() query: DoctorPatientsQueryDto,
  ): Promise<unknown> {
    return this.doctorService.listPatients(doctorId, query);
  }

  @Get('patients/:patientId')
  @ApiOperation({
    summary: 'Returns the clinical overview of a linked patient.',
  })
  getPatientDetail(
    @CurrentUser('sub') doctorId: string,
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Query() query: DoctorDashboardQueryDto,
  ): Promise<unknown> {
    return this.doctorService.getPatientDetail(doctorId, patientId, query);
  }

  @Get('patients/:patientId/records')
  @ApiOperation({ summary: 'Lists records of a linked patient.' })
  listPatientRecords(
    @CurrentUser('sub') doctorId: string,
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Query() query: DailyRecordQueryDto,
  ): Promise<unknown> {
    return this.doctorService.listPatientRecords(doctorId, patientId, query);
  }

  @Get('patients/:patientId/records/:recordId')
  @ApiOperation({ summary: 'Returns one record of a linked patient.' })
  getPatientRecord(
    @CurrentUser('sub') doctorId: string,
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Param('recordId', new ParseUUIDPipe()) recordId: string,
  ): Promise<unknown> {
    return this.doctorService.getPatientRecord(doctorId, patientId, recordId);
  }

  @Get('patients/:patientId/reports')
  @ApiOperation({ summary: 'Lists reports of a linked patient.' })
  listPatientReports(
    @CurrentUser('sub') doctorId: string,
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Query() query: ReportQueryDto,
  ): Promise<unknown> {
    return this.doctorService.listPatientReports(doctorId, patientId, query);
  }

  @Get('patients/:patientId/reports/generate')
  @ApiOperation({ summary: 'Generates a report for a linked patient.' })
  generatePatientReport(
    @CurrentUser('sub') doctorId: string,
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Query() dto: GenerateReportDto,
  ): Promise<unknown> {
    return this.doctorService.generatePatientReport(doctorId, patientId, dto);
  }

  @Get('patients/:patientId/reports/:reportId')
  @ApiOperation({ summary: 'Returns one report of a linked patient.' })
  getPatientReport(
    @CurrentUser('sub') doctorId: string,
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Param('reportId', new ParseUUIDPipe()) reportId: string,
  ): Promise<unknown> {
    return this.doctorService.getPatientReport(doctorId, patientId, reportId);
  }

  @Get('patients/:patientId/notes')
  @ApiOperation({ summary: 'Lists the doctor notes for a linked patient.' })
  listPatientNotes(
    @CurrentUser('sub') doctorId: string,
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Query() query: DoctorNotesQueryDto,
  ): Promise<unknown> {
    return this.doctorService.listPatientNotes(doctorId, patientId, query);
  }

  @Post('patients/:patientId/notes')
  @ApiOperation({
    summary: 'Creates a private doctor note for a linked patient.',
  })
  createPatientNote(
    @CurrentUser('sub') doctorId: string,
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Body() dto: CreateDoctorNoteDto,
  ): Promise<unknown> {
    return this.doctorService.createPatientNote(doctorId, patientId, dto);
  }

  @Patch('notes/:noteId')
  @ApiOperation({ summary: 'Updates a private doctor note.' })
  updateNote(
    @CurrentUser('sub') doctorId: string,
    @Param('noteId', new ParseUUIDPipe()) noteId: string,
    @Body() dto: UpdateDoctorNoteDto,
  ): Promise<unknown> {
    return this.doctorService.updateNote(doctorId, noteId, dto);
  }

  @Delete('notes/:noteId')
  @ApiOperation({ summary: 'Deletes a private doctor note.' })
  deleteNote(
    @CurrentUser('sub') doctorId: string,
    @Param('noteId', new ParseUUIDPipe()) noteId: string,
  ): Promise<unknown> {
    return this.doctorService.deleteNote(doctorId, noteId);
  }

  @Post('access-links')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Creates or reactivates a doctor-patient access link. Admin only.',
  })
  createAccessLink(
    @CurrentUser('sub') adminUserId: string,
    @Body() dto: CreateDoctorPatientAccessDto,
  ): Promise<unknown> {
    return this.doctorService.createAccessLink(adminUserId, dto);
  }

  @Patch('access-links/:accessId/revoke')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Revokes a doctor-patient access link. Admin only.',
  })
  revokeAccessLink(
    @Param('accessId', new ParseUUIDPipe()) accessId: string,
  ): Promise<unknown> {
    return this.doctorService.revokeAccessLink(accessId);
  }
}
