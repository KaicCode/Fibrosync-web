import { CommunityPostType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommunityPostDto {
  @ApiPropertyOptional({ enum: CommunityPostType, default: CommunityPostType.FEED })
  @IsOptional()
  @IsEnum(CommunityPostType)
  type?: CommunityPostType = CommunityPostType.FEED;

  @ApiProperty({
    minLength: 3,
    maxLength: 1200,
    example:
      'Hoje consegui fazer uma caminhada leve. Pequenas vitórias também contam.',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(1200)
  content!: string;
}
