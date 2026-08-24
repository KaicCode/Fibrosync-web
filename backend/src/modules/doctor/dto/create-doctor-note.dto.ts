import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDoctorNoteDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(4000)
  content!: string;
}
