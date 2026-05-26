import { CommunityPostType } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class CommunityPostQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: CommunityPostType })
  @IsOptional()
  @IsEnum(CommunityPostType)
  type?: CommunityPostType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}
