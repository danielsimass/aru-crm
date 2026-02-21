import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './jobs.entity';
import { JobStatus, JobType } from './jobs.types';

export interface ReserveBatchOptions {
  types?: JobType[];
  batchSize: number;
  workerId: string;
}

@Injectable()
export class JobsRepository {
  constructor(
    @InjectRepository(Job)
    private readonly repo: Repository<Job>,
  ) {}

  async save(job: Job): Promise<Job> {
    return this.repo.save(job);
  }

  async findById(id: string): Promise<Job | null> {
    return this.repo.findOne({ where: { id } });
  }

  /**
   * Reserves a batch of jobs with SELECT ... FOR UPDATE SKIP LOCKED.
   * Starts a transaction, selects PENDING jobs with availableAt <= now(),
   * locks them, updates to PROCESSING with lockedAt/lockedBy, returns full jobs.
   */
  async reserveBatch(options: ReserveBatchOptions): Promise<Job[]> {
    const { types, batchSize, workerId } = options;

    return this.repo.manager.transaction(async (tx) => {
      const qb = tx
        .createQueryBuilder(Job, 'job')
        .where('job.status = :status', { status: JobStatus.PENDING })
        .andWhere('job.available_at <= :now', { now: new Date() })
        .orderBy('job.available_at', 'ASC')
        .limit(batchSize)
        .setLock('pessimistic_write')
        .setOnLocked('skip_locked');

      if (types?.length) {
        qb.andWhere('job.type IN (:...types)', { types });
      }

      const jobs = await qb.getMany();
      if (jobs.length === 0) return [];

      const now = new Date();
      const ids = jobs.map((j) => j.id);
      await tx
        .createQueryBuilder()
        .update(Job)
        .set({
          status: JobStatus.PROCESSING,
          lockedAt: now,
          lockedBy: workerId,
          updatedAt: now,
        })
        .whereInIds(ids)
        .execute();

      return tx.createQueryBuilder(Job, 'job').whereInIds(ids).getMany();
    });
  }

  /**
   * Find jobs in PROCESSING with lockedAt older than the given date (for reaper).
   */
  async findStaleProcessing(olderThan: Date, limit: number): Promise<Job[]> {
    return this.repo
      .createQueryBuilder('job')
      .where('job.status = :status', { status: JobStatus.PROCESSING })
      .andWhere('job.locked_at < :olderThan', { olderThan })
      .orderBy('job.locked_at', 'ASC')
      .limit(limit)
      .getMany();
  }

  async findByDedupeKey(dedupeKey: string): Promise<Job | null> {
    return this.repo.findOne({
      where: { dedupeKey },
      order: { createdAt: 'DESC' },
    });
  }
}
