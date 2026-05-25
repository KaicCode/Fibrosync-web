import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { NotificationListResponseDto } from './dto/notification-list-response.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Lists notifications for the authenticated user.' })
  @ApiOkResponse({ type: NotificationListResponseDto })
  list(
    @CurrentUser('sub') userId: string,
    @Query() query: NotificationQueryDto,
  ): Promise<NotificationListResponseDto> {
    return this.notificationsService.listForUser(userId, query);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marks a notification as read.' })
  @ApiOkResponse({ type: NotificationResponseDto })
  @ApiNotFoundResponse({ description: 'Notification not found.' })
  markAsRead(
    @CurrentUser('sub') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markAsRead(userId, id);
  }
}
