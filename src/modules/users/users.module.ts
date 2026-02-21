import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UsersRepository } from './repositories';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), JobsModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
