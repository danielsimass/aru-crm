export enum JobType {
  EMAIL_SEND = 'EMAIL_SEND',
}

export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  DONE = 'DONE',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface EmailSendRecipient {
  kind: 'USER' | 'ATHLETE';
  id: string;
  email?: string;
  name?: string;
}

export interface EmailSendTemplate {
  key: string;
  locale?: string;
  version?: string;
}

export interface EmailSendPayloadMeta {
  correlationId?: string;
  requestedBy?: string;
}

export interface EmailSendPayload {
  recipient: EmailSendRecipient;
  template: EmailSendTemplate;
  data: Record<string, unknown>;
  meta?: EmailSendPayloadMeta;
}

export type JobPayloadMap = {
  [JobType.EMAIL_SEND]: EmailSendPayload;
};
