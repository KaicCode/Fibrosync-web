import { ApiProperty } from '@nestjs/swagger';
import { SymptomResponseDto } from './symptom-response.dto';

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

export class SymptomListResponseDto {
  @ApiProperty({ type: [SymptomResponseDto] })
  items!: SymptomResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
