import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { AthletesModule } from '../athletes/athletes.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AthletesModule, UsersModule, AuthModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
