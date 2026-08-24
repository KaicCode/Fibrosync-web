import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateDoctorPatientAccessDto {
  @ApiProperty()
  @IsUUID()
  doctorId!: string;

  @ApiProperty()
  @IsUUID()
  patientId!: string;

  @ApiPropertyOptional({ default: 'ADMIN' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  authorizationSource?: string;
}
