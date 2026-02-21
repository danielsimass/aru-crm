import { Injectable } from '@nestjs/common';
import { MailService } from '../../mail/mail.service';
import { Job } from '../jobs.entity';
import { JobType } from '../jobs.types';
import type { EmailSendPayload } from '../jobs.types';

@Injectable()
export class EmailSendHandler {
  readonly type = JobType.EMAIL_SEND;

  constructor(private readonly mailService: MailService) {}

  async handle(job: Job): Promise<{ successLog: string }> {
    const payload = this.validatePayload(job.payload);

    // Phase 1: recipient.email is required (TODO: later resolve from USER/ATHLETE by id)
    if (!payload.recipient?.email) {
      throw new Error(
        'recipient.email is required (phase1). TODO: resolve from DB by recipient.id when User/Athlete integration exists.',
      );
    }

    const email = payload.recipient.email;
    const name = payload.recipient.name;
    const templateKey = payload.template.key;
    const data = payload.data ?? {};
    const locale = payload.template.locale;

    const result = await this.mailService.sendTemplate(
      templateKey,
      email,
      data as Record<string, unknown>,
      {
        locale,
        recipientName: name,
      },
    );

    return result;
  }

  private validatePayload(payload: unknown): EmailSendPayload {
    if (!payload || typeof payload !== 'object')
      throw new Error('EMAIL_SEND payload must be an object');

    const p = payload as Record<string, unknown>;
    if (!p.recipient || typeof p.recipient !== 'object')
      throw new Error('EMAIL_SEND payload.recipient is required');
    const recipient = p.recipient as Record<string, unknown>;
    if (typeof recipient.kind !== 'string' || !['USER', 'ATHLETE'].includes(recipient.kind))
      throw new Error('payload.recipient.kind must be USER or ATHLETE');
    if (typeof recipient.id !== 'string')
      throw new Error('payload.recipient.id is required');

    if (!p.template || typeof p.template !== 'object')
      throw new Error('EMAIL_SEND payload.template is required');
    const template = p.template as Record<string, unknown>;
    if (typeof template.key !== 'string')
      throw new Error('payload.template.key is required');

    return {
      recipient: {
        kind: recipient.kind as 'USER' | 'ATHLETE',
        id: recipient.id as string,
        email: recipient.email as string | undefined,
        name: recipient.name as string | undefined,
      },
      template: {
        key: template.key as string,
        locale: template.locale as string | undefined,
        version: template.version as string | undefined,
      },
      data: (p.data && typeof p.data === 'object' ? p.data : {}) as Record<string, unknown>,
      meta: p.meta as EmailSendPayload['meta'],
    };
  }
}
