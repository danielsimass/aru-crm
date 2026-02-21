import { JobType } from '../jobs.types';
import { Job } from '../jobs.entity';

export interface JobHandlerResult {
  successLog?: string;
}

export interface JobHandler {
  type: JobType;
  handle(job: Job): Promise<JobHandlerResult | void>;
}

const registry = new Map<JobType, JobHandler>();

export function registerHandler(handler: JobHandler): void {
  registry.set(handler.type, handler);
}

export function getHandler(type: JobType): JobHandler | undefined {
  return registry.get(type);
}
