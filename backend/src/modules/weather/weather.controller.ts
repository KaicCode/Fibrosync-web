import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { WEATHER_ROUTES } from './weather.routes';
import { WeatherService } from './weather.service';
import { CurrentWeatherQueryDto, WeatherSnapshotDto } from './weather.types';

@ApiTags('Weather')
@ApiBearerAuth('access-token')
@Controller(WEATHER_ROUTES.base)
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get(WEATHER_ROUTES.current)
  @ApiOperation({
    summary:
      'Returns current weather conditions for the provided coordinates using Open-Meteo.',
  })
  @ApiOkResponse({ type: WeatherSnapshotDto })
  current(
    @CurrentUser('sub') userId: string,
    @Query() query: CurrentWeatherQueryDto,
  ): Promise<WeatherSnapshotDto> {
    return this.weatherService.getCurrentWeather(userId, query.lat, query.lon);
  }
}
