import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard, seconds } from '@nestjs/throttler';
import { AppController } from './app.controller';
import aiConfig from './config/ai.config';
import appConfig from './config/app.config';
import authConfig from './config/auth.config';
import databaseConfig from './config/database.config';
import { validationSchema } from './config/env.validation';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { DatabaseModule } from './database/database.module';
import { AiModule } from './modules/ai/ai.module';
import { AdminAnalyticsModule } from './modules/admin-analytics/admin-analytics.module';
import { AdminDashboardModule } from './modules/admin-dashboard/admin-dashboard.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { AuthModule } from './modules/auth/auth.module';
import { CommunityPostsModule } from './modules/community-posts/community-posts.module';
import { CrisisPredictionModule } from './modules/crisis-prediction/crisis-prediction.module';
import { DailyRecordsModule } from './modules/daily-records/daily-records.module';
import { DoctorModule } from './modules/doctor/doctor.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SystemSettingsModule } from './modules/system-settings/system-settings.module';
import { SymptomsModule } from './modules/symptoms/symptoms.module';
import { UsersModule } from './modules/users/users.module';
import { WeatherModule } from './modules/weather/weather.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [appConfig, authConfig, databaseConfig, aiConfig],
      validationSchema,
    }),
    // F-10: baseline rate limiting for every route (in-memory storage —
    // adequate for a single backend instance; a multi-instance deployment
    // would need a shared store such as Redis, see remediation report).
    // Sensitive auth endpoints override this with stricter per-route
    // limits via @Throttle (see AuthController).
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: seconds(60),
        limit: 120,
      },
    ]),
    DatabaseModule,
    AuthModule,
    AdminAnalyticsModule,
    AdminDashboardModule,
    UsersModule,
    CommunityPostsModule,
    SymptomsModule,
    DailyRecordsModule,
    DoctorModule,
    WeatherModule,
    CrisisPredictionModule,
    NotificationsModule,
    SystemSettingsModule,
    ReportsModule,
    AiModule,
    ExercisesModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
