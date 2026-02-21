import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { JobsModule } from '../jobs/jobs.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [JobsModule, AuthModule],
  controllers: [AdminController],
})
export class AdminModule {}
