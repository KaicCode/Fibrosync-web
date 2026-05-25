import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class AppController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Returns the API health status.' })
  getHealth(): { status: 'ok'; service: string } {
    return {
      status: 'ok',
      service: 'FibroSync API',
    };
  }
}
