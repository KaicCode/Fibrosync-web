import { ApiProperty } from '@nestjs/swagger';

export class DeleteDailyRecordResponseDto {
  @ApiProperty()
  message!: string;
}
