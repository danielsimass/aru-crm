import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from './jobs.entity';
import { JobsRepository } from './jobs.repository';
import { JobStatus, JobType } from './jobs.types';
import { getHandler } from './handlers';

const MIN_BACKOFF_MS = 30_000; // 30s
const MAX_BACKOFF_MS = 30 * 60 * 1000; // 30 min

function backoffMs(attempts: number): number {
  const ms = MIN_BACKOFF_MS * Math.pow(2, attempts);
  return Math.min(ms, MAX_BACKOFF_MS);
}

@Injectable()
export class JobsWorker implements OnModuleInit {
  private readonly logger = new Logger(JobsWorker.name);
  private running = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private reaperTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Inject('JOBS_HANDLERS_INIT') _init: boolean,
    private readonly config: ConfigService,
    private readonly jobsRepository: JobsRepository,
  ) {}

  onModuleInit(): void {
    const configEnabled = this.config.get<boolean>(
      'jobs.worker.enabled',
      false,
    );
    const argEnabled = process.argv.includes('--worker');
    const enabled = configEnabled || argEnabled;

    this.logger.log(
      `Jobs worker init: config=${configEnabled} arg=${argEnabled} enabled=${enabled}`,
    );

    if (!enabled) {
      this.logger.warn(
        '⚠️  Jobs worker is DISABLED. Jobs will be created but NOT processed.',
      );
      this.logger.warn(
        '   To enable: set JOBS_WORKER_ENABLED=true in .env or run with --worker flag',
      );
      return;
    }

    this.start();
  }

  private start(): void {
    if (this.running) return;
    this.running = true;
    const pollMs = this.config.get<number>('jobs.worker.pollMs', 2000);
    const lockTtlSeconds = this.config.get<number>(
      'jobs.worker.lockTtlSeconds',
      300,
    );

    this.logger.log('Jobs worker started');
    this.runPollLoop(pollMs);
    this.runReaperLoop(lockTtlSeconds);
  }

  private runPollLoop(pollMs: number): void {
    this.pollTimer = setInterval(() => {
      this.tick().catch((err) => {
        this.logger.error('Error in poll loop:', err);
      });
    }, pollMs);
  }

  private runReaperLoop(lockTtlSeconds: number): void {
    const intervalMs = Math.max(10000, Math.min(60000, lockTtlSeconds * 1000));
    this.reaperTimer = setInterval(() => {
      this.reapStaleJobs(lockTtlSeconds).catch((err) => {
        this.logger.error('Error in reaper loop:', err);
      });
    }, intervalMs);
  }

  private async reapStaleJobs(lockTtlSeconds: number): Promise<void> {
    const olderThan = new Date(Date.now() - lockTtlSeconds * 1000);
    const batchSize = this.config.get<number>('jobs.worker.batchSize', 10);
    const stale = await this.jobsRepository.findStaleProcessing(
      olderThan,
      batchSize,
    );
    if (stale.length === 0) return;

    this.logger.warn(`Reaping ${stale.length} stale PROCESSING jobs`);
    for (const job of stale) {
      job.status = JobStatus.PENDING;
      job.lockedAt = null;
      job.lockedBy = null;
      await this.jobsRepository.save(job);
    }
  }

  private async tick(): Promise<void> {
    const concurrency = this.config.get<number>('jobs.worker.concurrency', 1);
    const batchSize = this.config.get<number>('jobs.worker.batchSize', 10);
    const workerId = `worker-${process.pid}-${Date.now()}`;

    const jobs = await this.jobsRepository.reserveBatch({
      batchSize: batchSize * concurrency,
      workerId,
    });

    if (jobs.length === 0) return;

    const chunks: Job[][] = [];
    for (let i = 0; i < jobs.length; i += concurrency) {
      chunks.push(jobs.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
      await Promise.all(chunk.map((job) => this.processOne(job)));
    }
  }

  private async processOne(job: Job): Promise<void> {
    const correlationId =
      (job.payload as Record<string, unknown>)?.meta &&
      typeof (job.payload as Record<string, unknown>).meta === 'object'
        ? (
            (job.payload as Record<string, unknown>).meta as Record<
              string,
              unknown
            >
          ).correlationId
        : undefined;
    const logCtx = correlationId
      ? `[${typeof correlationId === 'string' ? correlationId : JSON.stringify(correlationId)}]`
      : '';

    this.logger.log(
      `${logCtx} Processing job ${job.id} type=${job.type} attempts=${job.attempts}`,
    );

    const handler = getHandler(job.type as JobType);
    if (!handler) {
      this.logger.error(`${logCtx} No handler for job type ${job.type}`);
      await this.markFailed(job, `No handler for type ${job.type}`);
      return;
    }

    // Increment attempts before processing
    job.attempts += 1;

    try {
      const result = await handler.handle(job);
      await this.markDone(job, result?.successLog);
      this.logger.log(`${logCtx} Job ${job.id} done`);
    } catch (err) {
      const errorDetails = this.formatError(err);
      this.logger.warn(`${logCtx} Job ${job.id} error: ${errorDetails}`);
      await this.handleFailure(job, errorDetails);
    }
  }

  private async markDone(job: Job, successLog?: string): Promise<void> {
    job.status = JobStatus.DONE;
    job.doneAt = new Date();
    job.lockedAt = null;
    job.lockedBy = null;
    job.lastError = null;
    job.lastSuccess = successLog || null;
    await this.jobsRepository.save(job);
  }

  private async markFailed(job: Job, error: string): Promise<void> {
    job.status = JobStatus.FAILED;
    job.lastError = error;
    job.lockedAt = null;
    job.lockedBy = null;
    await this.jobsRepository.save(job);
  }

  /**
   * Formats error for storage in lastError field.
   * Includes message, stack trace, and SendGrid response details if available.
   */
  private formatError(err: unknown): string {
    const errorDetails: {
      name?: string;
      message: string;
      stack?: string;
      response?: {
        statusCode?: number;
        body?: unknown;
        headers?: unknown;
      };
      originalError?: unknown;
      timestamp: string;
    } = {
      message: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    };

    if (err instanceof Error) {
      errorDetails.name = err.name;
      if (err.stack) {
        errorDetails.stack = err.stack;
      }

      // Check if error has attached response (from MailProvider)
      if ('response' in err && err.response) {
        const response = (err as { response?: unknown }).response;
        if (response && typeof response === 'object') {
          const resp = response as {
            statusCode?: number;
            body?: unknown;
            headers?: unknown;
          };
          errorDetails.response = {
            statusCode: resp.statusCode,
            body: resp.body,
            headers: resp.headers,
          };
        }
      }

      // Check for originalError (from MailProvider enhanced error)
      if ('originalError' in err && err.originalError) {
        const original = err.originalError;
        if (
          original &&
          typeof original === 'object' &&
          'response' in original
        ) {
          const origResp = (original as { response?: unknown }).response;
          if (origResp && typeof origResp === 'object') {
            const resp = origResp as {
              statusCode?: number;
              body?: unknown;
              headers?: unknown;
            };
            errorDetails.response = {
              statusCode: resp.statusCode,
              body: resp.body,
              headers: resp.headers,
            };
          }
        }
      }
    } else if (err && typeof err === 'object') {
      // For non-Error objects, try to extract response
      if ('response' in err) {
        const response = (err as { response?: unknown }).response;
        if (response && typeof response === 'object') {
          const resp = response as {
            statusCode?: number;
            body?: unknown;
            headers?: unknown;
          };
          errorDetails.response = {
            statusCode: resp.statusCode,
            body: resp.body,
            headers: resp.headers,
          };
        }
      }
    }

    try {
      return JSON.stringify(errorDetails, null, 2);
    } catch {
      // Fallback if JSON.stringify fails
      return `Error: ${errorDetails.message}\nTimestamp: ${errorDetails.timestamp}`;
    }
  }

  private async handleFailure(job: Job, error: string): Promise<void> {
    job.attempts += 1;
    job.lastError = error;
    job.lockedAt = null;
    job.lockedBy = null;

    if (job.attempts >= job.maxAttempts) {
      job.status = JobStatus.FAILED;
      this.logger.error(`Job ${job.id} failed after ${job.attempts} attempts`);
    } else {
      job.status = JobStatus.PENDING;
      const delayMs = backoffMs(job.attempts);
      job.availableAt = new Date(Date.now() + delayMs);
      this.logger.log(
        `Job ${job.id} will retry at ${job.availableAt.toISOString()} (attempt ${job.attempts}/${job.maxAttempts})`,
      );
    }

    await this.jobsRepository.save(job);
  }

  stop(): void {
    this.running = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.reaperTimer) {
      clearInterval(this.reaperTimer);
      this.reaperTimer = null;
    }
    this.logger.log('Jobs worker stopped');
  }
}
