import { registerAs } from '@nestjs/config';

export default registerAs('jobs', () => {
  console.log(
    'process.env.JOBS_WORKER_ENABLED',
    process.env.JOBS_WORKER_ENABLED,
  );
  console.log(
    'process.env.JOBS_WORKER_CONCURRENCY',
    process.env.JOBS_WORKER_CONCURRENCY,
  );
  console.log(
    'process.env.JOBS_WORKER_POLL_MS',
    process.env.JOBS_WORKER_POLL_MS,
  );
  console.log(
    'process.env.JOBS_WORKER_BATCH_SIZE',
    process.env.JOBS_WORKER_BATCH_SIZE,
  );
  console.log(
    'process.env.JOBS_WORKER_LOCK_TTL_SECONDS',
    process.env.JOBS_WORKER_LOCK_TTL_SECONDS,
  );
  return {
    worker: {
      enabled: process.env.JOBS_WORKER_ENABLED === 'true',
      concurrency: Math.max(
        1,
        parseInt(process.env.JOBS_WORKER_CONCURRENCY ?? '1', 10),
      ),
      pollMs: Math.max(
        500,
        parseInt(process.env.JOBS_WORKER_POLL_MS ?? '2000', 10),
      ),
      batchSize: Math.max(
        1,
        Math.min(100, parseInt(process.env.JOBS_WORKER_BATCH_SIZE ?? '10', 10)),
      ),
      lockTtlSeconds: Math.max(
        60,
        parseInt(process.env.JOBS_WORKER_LOCK_TTL_SECONDS ?? '300', 10),
      ),
    },
  };
});
