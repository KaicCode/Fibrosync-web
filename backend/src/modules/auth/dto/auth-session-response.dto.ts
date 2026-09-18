import { ApiProperty } from '@nestjs/swagger';
import { AuthenticatedUserResponseDto } from './authenticated-user-response.dto';

export class AuthSessionResponseDto {
  @ApiProperty({ type: AuthenticatedUserResponseDto })
  user!: AuthenticatedUserResponseDto;

  @ApiProperty()
  accessToken!: string;

  // F-14: the refresh token is no longer returned in the response body —
  // it is set as an httpOnly cookie instead (see AuthController).

  @ApiProperty({ example: 'Bearer' })
  tokenType!: 'Bearer';

  @ApiProperty({ example: '15m' })
  accessTokenTtl!: string;

  @ApiProperty({ example: '7d' })
  refreshTokenTtl!: string;
}
