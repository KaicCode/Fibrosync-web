import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class ResetSystemSettingsDto {
  @ApiProperty({
    description:
      'Last known updatedAt from the client. Used to prevent overwriting newer changes.',
  })
  @IsDateString()
  expectedUpdatedAt!: string;
}
