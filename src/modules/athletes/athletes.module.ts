import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AthletesService } from './athletes.service';
import { AthletesController } from './athletes.controller';
import { Athlete } from './entities/athlete.entity';
import { AthletesRepository } from './repositories';
import { AuthModule } from '../auth/auth.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Athlete]),
    AuthModule,
    CategoriesModule,
  ],
  controllers: [AthletesController],
  providers: [AthletesService, AthletesRepository],
  exports: [AthletesService],
})
export class AthletesModule {}
