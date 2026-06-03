import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { CreateSymptomDto } from './create-symptom.dto';

export class AdminCreateSymptomDto extends CreateSymptomDto {
  @ApiProperty()
  @IsUUID()
  userId!: string;
}
