import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '@/common/decorators/roles.decorator';
import type { AdminDashboardResponse } from './admin-dashboard.types';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminDashboardQueryDto } from './dto/admin-dashboard-query.dto';

@ApiTags('Admin Dashboard')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(
    private readonly adminDashboardService: AdminDashboardService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Returns aggregated operational metrics for the admin dashboard.',
  })
  @ApiOkResponse({
    description: 'Admin dashboard metrics were loaded successfully.',
  })
  getDashboard(
    @Query() query: AdminDashboardQueryDto,
  ): Promise<AdminDashboardResponse> {
    return this.adminDashboardService.getDashboard(query.periodDays);
  }
}
