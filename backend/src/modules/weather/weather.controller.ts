import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { WEATHER_ROUTES } from './weather.routes';
import { WeatherService } from './weather.service';
import { CurrentWeatherRequestDto, WeatherSnapshotDto } from './weather.types';

@ApiTags('Weather')
@ApiBearerAuth('access-token')
@Controller(WEATHER_ROUTES.base)
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  // F-20: POST + body instead of GET + query string, so coordinates never
  // land in the URL (browser history, proxy/CDN access logs, Referer
  // headers).
  @Post(WEATHER_ROUTES.current)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Returns current weather conditions for the provided coordinates using Open-Meteo.',
  })
  @ApiOkResponse({ type: WeatherSnapshotDto })
  current(
    @CurrentUser('sub') userId: string,
    @Body() body: CurrentWeatherRequestDto,
  ): Promise<WeatherSnapshotDto> {
    return this.weatherService.getCurrentWeather(userId, body.lat, body.lon);
  }
}
