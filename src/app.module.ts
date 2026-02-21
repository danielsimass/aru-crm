import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './modules/database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AthletesModule } from './modules/athletes/athletes.module';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MailModule } from './modules/mail/mail.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { AdminModule } from './modules/admin/admin.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 20,
    }),
    DatabaseModule,
    MailModule,
    UsersModule,
    AuthModule,
    AthletesModule,
    DashboardModule,
    JobsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
