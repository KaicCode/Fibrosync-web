import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import type { SystemSettingsSummary } from './system-settings.types';
import { ResetSystemSettingsDto } from './dto/reset-system-settings.dto';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';
import { SystemSettingsService } from './system-settings.service';

@ApiTags('System Settings')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN)
@Controller('admin/settings')
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Get()
  @ApiOperation({
    summary:
      'Returns the global system settings used by the administrative panel.',
  })
  getSummary(): Promise<SystemSettingsSummary> {
    return this.systemSettingsService.getSummary();
  }

  @Patch()
  @ApiOperation({
    summary: 'Updates the global system settings. Admin only.',
  })
  updateSettings(
    @CurrentUser('sub') adminUserId: string,
    @Body() dto: UpdateSystemSettingsDto,
  ): Promise<SystemSettingsSummary> {
    return this.systemSettingsService.updateSettings(adminUserId, dto);
  }

  @Post('reset')
  @ApiOperation({
    summary:
      'Restores the global system settings to documented defaults. Admin only.',
  })
  resetSettings(
    @CurrentUser('sub') adminUserId: string,
    @Body() dto: ResetSystemSettingsDto,
  ): Promise<SystemSettingsSummary> {
    return this.systemSettingsService.resetSettings(adminUserId, dto);
  }
}
