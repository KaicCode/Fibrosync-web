import { ApiProperty } from '@nestjs/swagger';
import { CommunityPostResponseDto } from './community-post-response.dto';

class PaginationMetaDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}

export class CommunityPostListResponseDto {
  @ApiProperty({ type: [CommunityPostResponseDto] })
  items!: CommunityPostResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
