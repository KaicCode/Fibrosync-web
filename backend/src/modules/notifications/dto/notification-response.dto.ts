import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { NotificationType } from '../enums/notification-type.enum';

export class NotificationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: NotificationType })
  type!: NotificationType;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty()
  read!: boolean;

  @ApiProperty({ enum: NotificationStatus })
  status!: NotificationStatus;

  @ApiProperty({ enum: NotificationChannel })
  channel!: NotificationChannel;

  @ApiPropertyOptional()
  payload?: Record<string, unknown> | null;

  @ApiPropertyOptional({ format: 'date-time' })
  sentAt?: Date | null;

  @ApiPropertyOptional({ format: 'date-time' })
  readAt?: Date | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
