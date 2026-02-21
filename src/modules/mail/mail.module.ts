import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailProvider } from './mail.provider';
import { MailService } from './mail.service';

export const MAIL_PROVIDER = 'MAIL_PROVIDER';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: MAIL_PROVIDER,
      useFactory: (config: ConfigService) => {
        const apiKey = config.get<string>('SENDGRID_API_KEY', '');
        const defaultFrom =
          config.get<string>('MAIL_DEFAULT_FROM') || 'noreply@example.com';
        return new MailProvider({ apiKey, defaultFrom });
      },
      inject: [ConfigService],
    },
    {
      provide: MailProvider,
      useExisting: MAIL_PROVIDER,
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
