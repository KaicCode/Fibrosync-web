import { Role, CommunityPostType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

class CommunityPostAuthorDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({ enum: Role })
  role!: Role;
}

export class CommunityPostResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: CommunityPostType })
  type!: CommunityPostType;

  @ApiProperty()
  content!: string;

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiProperty()
  likesCount!: number;

  @ApiProperty()
  commentsCount!: number;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;

  @ApiProperty({ type: CommunityPostAuthorDto })
  author!: CommunityPostAuthorDto;
}
