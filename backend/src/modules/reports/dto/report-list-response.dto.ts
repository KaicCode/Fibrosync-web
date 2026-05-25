import { ApiProperty } from '@nestjs/swagger';
import { ReportResponseDto } from './report-response.dto';

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

export class ReportListResponseDto {
  @ApiProperty({ type: [ReportResponseDto] })
  items!: ReportResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
