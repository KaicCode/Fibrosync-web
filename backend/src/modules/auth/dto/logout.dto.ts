import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class LogoutDto {
  // F-14: the refresh token is no longer accepted from the client — it is
  // read from the httpOnly cookie on the server side instead.
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  logoutFromAllDevices?: boolean;
}
