import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';
import { PrismaService } from './database/prisma.service';

@ApiTags('Health')
@Controller('health')
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Returns the API health status.' })
  async getHealth(): Promise<{
    status: 'ok';
    service: string;
    database: 'ok';
  }> {
    try {
      await this.prisma.$queryRawUnsafe('select 1');
    } catch {
      throw new ServiceUnavailableException('Database unavailable.');
    }

    return {
      status: 'ok',
      service: 'FibroSync API',
      database: 'ok',
    };
  }
}
