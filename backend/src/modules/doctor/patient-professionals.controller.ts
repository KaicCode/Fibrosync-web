import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { ProfessionalLinksService } from './professional-links.service';

@ApiTags('Patient Professionals')
@ApiBearerAuth('access-token')
@Roles(Role.USER)
@Controller('patient/professionals')
export class PatientProfessionalsController {
  constructor(
    private readonly professionalLinksService: ProfessionalLinksService,
  ) {}

  @Get('code')
  @ApiOperation({ summary: 'Returns the authenticated patient link code.' })
  getCode(@CurrentUser('sub') patientId: string): Promise<unknown> {
    return this.professionalLinksService.getPatientLinkCode(patientId);
  }

  @Post('code/regenerate')
  @ApiOperation({ summary: 'Regenerates the authenticated patient link code.' })
  regenerateCode(@CurrentUser('sub') patientId: string): Promise<unknown> {
    return this.professionalLinksService.regeneratePatientLinkCode(patientId);
  }

  @Get('requests')
  @ApiOperation({
    summary:
      'Lists pending professional access requests for the authenticated patient.',
  })
  listRequests(@CurrentUser('sub') patientId: string): Promise<unknown> {
    return this.professionalLinksService.listPatientRequests(patientId);
  }

  @Post('requests/:accessId/accept')
  @ApiOperation({
    summary:
      'Accepts a professional access request for the authenticated patient.',
  })
  acceptRequest(
    @CurrentUser('sub') patientId: string,
    @Param('accessId', new ParseUUIDPipe()) accessId: string,
  ): Promise<unknown> {
    return this.professionalLinksService.acceptPatientRequest(
      patientId,
      accessId,
    );
  }

  @Post('requests/:accessId/reject')
  @ApiOperation({
    summary:
      'Rejects a professional access request for the authenticated patient.',
  })
  rejectRequest(
    @CurrentUser('sub') patientId: string,
    @Param('accessId', new ParseUUIDPipe()) accessId: string,
  ): Promise<unknown> {
    return this.professionalLinksService.rejectPatientRequest(
      patientId,
      accessId,
    );
  }

  @Get()
  @ApiOperation({
    summary:
      'Lists professionals already authorized by the authenticated patient.',
  })
  listProfessionals(@CurrentUser('sub') patientId: string): Promise<unknown> {
    return this.professionalLinksService.listAuthorizedProfessionals(patientId);
  }

  @Delete(':accessId')
  @ApiOperation({
    summary: 'Revokes a professional access for the authenticated patient.',
  })
  revokeProfessional(
    @CurrentUser('sub') patientId: string,
    @Param('accessId', new ParseUUIDPipe()) accessId: string,
  ): Promise<unknown> {
    return this.professionalLinksService.revokeProfessionalAccess(
      patientId,
      accessId,
    );
  }
}
