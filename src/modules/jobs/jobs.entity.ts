import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { JobStatus, JobType } from './jobs.types';

@Entity('jobs')
@Index(['status', 'availableAt'])
@Index(['type', 'status', 'availableAt'])
@Index(['lockedAt'])
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: JobType,
    enumName: 'jobs_type_enum',
  })
  type: JobType;

  @Column({
    type: 'enum',
    enum: JobStatus,
    enumName: 'jobs_status_enum',
  })
  status: JobStatus;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, unknown> | null;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'dedupe_key',
    nullable: true,
    unique: true,
  })
  dedupeKey: string | null;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'int', name: 'max_attempts', default: 3 })
  maxAttempts: number;

  @Column({ type: 'text', name: 'last_error', nullable: true })
  lastError: string | null;

  @Column({ type: 'text', name: 'last_success', nullable: true })
  lastSuccess: string | null;

  @Column({ type: 'timestamptz', name: 'available_at', default: () => 'now()' })
  availableAt: Date;

  @Column({ type: 'timestamptz', name: 'locked_at', nullable: true })
  lockedAt: Date | null;

  @Column({ type: 'varchar', length: 100, name: 'locked_by', nullable: true })
  lockedBy: string | null;

  @Column({ type: 'timestamptz', name: 'done_at', nullable: true })
  doneAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
