import { ApiProperty } from '@nestjs/swagger';

export class DeleteSymptomResponseDto {
  @ApiProperty()
  message!: string;
}
