import { ApiProperty } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

export class PatientLinkCodeDto {
  @ApiProperty({ example: 'FS-K8P4X2' })
  @Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(/^FS-[A-HJ-NP-Z2-9]{6}$/)
  code!: string;
}
