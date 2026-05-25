import { ApiProperty } from '@nestjs/swagger';
import { AuthenticatedUserResponseDto } from './authenticated-user-response.dto';

export class AuthSessionResponseDto {
  @ApiProperty({ type: AuthenticatedUserResponseDto })
  user!: AuthenticatedUserResponseDto;

  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: 'Bearer';

  @ApiProperty({ example: '15m' })
  accessTokenTtl!: string;

  @ApiProperty({ example: '7d' })
  refreshTokenTtl!: string;
}
