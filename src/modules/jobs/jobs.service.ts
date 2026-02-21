import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Job } from './jobs.entity';
import { JobsRepository } from './jobs.repository';
import { JobStatus, JobType } from './jobs.types';

export interface EnqueueOptions {
  dedupeKey?: string;
  maxAttempts?: number;
  availableAt?: Date;
}

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(private readonly jobsRepository: JobsRepository) {}

  /**
   * Enqueues a job. If dedupeKey is provided and a job with that key already
   * exists (any status), returns the existing job without creating a duplicate.
   */
  async enqueue<T extends JobType>(
    type: T,
    payload: Record<string, unknown>,
    options?: EnqueueOptions,
  ): Promise<Job> {
    if (options?.dedupeKey) {
      const existing = await this.jobsRepository.findByDedupeKey(
        options.dedupeKey,
      );
      if (existing) return existing;
    }

    const job = new Job();
    job.type = type;
    job.status = JobStatus.PENDING;
    job.payload = payload;
    job.dedupeKey = options?.dedupeKey ?? null;
    job.attempts = 0;
    job.maxAttempts = options?.maxAttempts ?? 3;
    job.lastError = null;
    job.availableAt = options?.availableAt ?? new Date();
    job.lockedAt = null;
    job.lockedBy = null;
    job.doneAt = null;

    const saved = await this.jobsRepository.save(job);
    this.logger.log(
      `Job enqueued: id=${saved.id} type=${saved.type} status=${saved.status}`,
    );
    return saved;
  }

  async getById(id: string): Promise<Job> {
    const job = await this.jobsRepository.findById(id);
    if (!job) throw new NotFoundException('Tarefa não encontrada');
    return job;
  }

  async cancel(id: string): Promise<Job> {
    const job = await this.getById(id);
    if (job.status !== JobStatus.PENDING && job.status !== JobStatus.PROCESSING)
      return job;
    job.status = JobStatus.CANCELLED;
    job.lockedAt = null;
    job.lockedBy = null;
    return this.jobsRepository.save(job);
  }
}
