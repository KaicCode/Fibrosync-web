import { ApiProperty } from '@nestjs/swagger';
import { DailyRecordResponseDto } from './daily-record-response.dto';

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

export class DailyRecordListResponseDto {
  @ApiProperty({ type: [DailyRecordResponseDto] })
  items!: DailyRecordResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
