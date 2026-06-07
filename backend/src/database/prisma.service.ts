import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

function describeConnectionTarget(connectionString: string): string {
  try {
    const parsed = new URL(connectionString);
    const databaseName = parsed.pathname.replace(/^\/+/, '') || '(default)';
    const port = parsed.port || '5432';

    return `${parsed.hostname}:${port}/${databaseName}`;
  } catch {
    return 'invalid DATABASE_URL';
  }
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly connectionTarget: string;

  constructor(configService: ConfigService) {
    const connectionString = configService
      .getOrThrow<string>('database.url')
      .trim();
    const adapter = new PrismaPg({
      connectionString,
    });

    super({
      adapter,
      log: ['error', 'warn'],
    });

    this.connectionTarget = describeConnectionTarget(connectionString);
  }

  async onModuleInit(): Promise<void> {
    this.logger.log(`Connecting to PostgreSQL via Prisma at ${this.connectionTarget}.`);

    try {
      await this.$connect();
      this.logger.log(`Connected to PostgreSQL via Prisma at ${this.connectionTarget}.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown database connection error.';

      this.logger.error(
        `Failed to connect to PostgreSQL via Prisma at ${this.connectionTarget}: ${message}`,
      );

      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
