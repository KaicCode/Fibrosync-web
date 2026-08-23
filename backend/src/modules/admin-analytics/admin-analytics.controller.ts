import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '@/common/decorators/roles.decorator';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminAnalyticsQueryDto } from './dto/admin-analytics-query.dto';
import type { AdminAnalyticsResponse } from './admin-analytics.types';

@ApiTags('Admin Analytics')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN)
@Controller('admin/analytics')
export class AdminAnalyticsController {
  constructor(
    private readonly adminAnalyticsService: AdminAnalyticsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Returns aggregated analytics for the administrative panel.',
  })
  @ApiOkResponse({
    description: 'Administrative analytics were loaded successfully.',
  })
  getAnalytics(
    @Query() query: AdminAnalyticsQueryDto,
  ): Promise<AdminAnalyticsResponse> {
    return this.adminAnalyticsService.getAnalytics(query);
  }
}
