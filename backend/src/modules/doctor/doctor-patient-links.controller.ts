import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { PatientLinkCodeDto } from './dto/patient-link-code.dto';
import { ProfessionalLinksService } from './professional-links.service';

@ApiTags('Doctor Patient Links')
@ApiBearerAuth('access-token')
@Roles(Role.MEDICAL)
@Controller('doctor/patient-links')
export class DoctorPatientLinksController {
  constructor(
    private readonly professionalLinksService: ProfessionalLinksService,
  ) {}

  @Post('lookup')
  @ApiOperation({
    summary: 'Looks up a patient by link code without exposing clinical data.',
  })
  lookup(
    @CurrentUser('sub') doctorId: string,
    @Body() dto: PatientLinkCodeDto,
  ): Promise<unknown> {
    return this.professionalLinksService.lookupPatientByCode(doctorId, dto);
  }

  @Post('request')
  @ApiOperation({
    summary: 'Sends a patient follow-up request using a patient link code.',
  })
  request(
    @CurrentUser('sub') doctorId: string,
    @Body() dto: PatientLinkCodeDto,
  ): Promise<unknown> {
    return this.professionalLinksService.requestLinkByCode(doctorId, dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Lists pending and updated follow-up requests created by the doctor.',
  })
  listOwnRequests(@CurrentUser('sub') doctorId: string): Promise<unknown> {
    return this.professionalLinksService.listDoctorRequests(doctorId);
  }
}
