import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '../database/database.module';
import { MailModule } from '../mail/mail.module';
import { Job } from './jobs.entity';
import { JobsRepository } from './jobs.repository';
import { JobsService } from './jobs.service';
import { JobsWorker } from './jobs.worker';
import { registerHandler } from './handlers';
import { EmailSendHandler } from './handlers/email-send.handler';
import jobsConfig from './jobs.config';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forFeature(jobsConfig),
    TypeOrmModule.forFeature([Job]),
    MailModule,
  ],
  providers: [
    JobsRepository,
    JobsService,
    EmailSendHandler,
    {
      provide: 'JOBS_HANDLERS_INIT',
      useFactory: (emailSendHandler: EmailSendHandler): boolean => {
        registerHandler(emailSendHandler);
        return true;
      },
      inject: [EmailSendHandler],
    },
    JobsWorker,
  ],
  exports: [JobsService],
})
export class JobsModule {}
