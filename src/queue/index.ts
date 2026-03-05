import { Queue, Worker, Job, JobsOptions, WorkerOptions } from 'bullmq';
import { config } from '../config';
import { logger } from '../logger';

export interface QueueOptions {
  name: string;
  defaultJobOptions?: JobsOptions;
}

export interface RedisOptions {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  url?: string;
}

export interface JobData {
  [key: string]: unknown;
}

export type JobProcessor = (job: Job<JobData>) => Promise<unknown>;

class QueueManager {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private redisOptions: RedisOptions;

  constructor() {
    const redisUrl = config.get('REDIS_URL');
    if (redisUrl) {
      this.redisOptions = { url: redisUrl };
    } else {
      this.redisOptions = {
        host: 'localhost',
        port: 6379,
      };
    }
  }

  setRedisOptions(options: RedisOptions): void {
    this.redisOptions = options;
  }

  createQueue(name: string, options?: Partial<QueueOptions>): Queue {
    if (this.queues.has(name)) {
      return this.queues.get(name)!;
    }

    const queue = new Queue(name, {
      connection: this.redisOptions as any,
      defaultJobOptions: options?.defaultJobOptions || {
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    });

    this.queues.set(name, queue);
    logger.info(`Queue "${name}" created`);

    return queue;
  }

  getQueue(name: string): Queue | undefined {
    return this.queues.get(name);
  }

  async addJob(
    queueName: string,
    jobName: string,
    data: JobData,
    options?: JobsOptions
  ): Promise<Job> {
    const queue = this.getQueue(queueName) || this.createQueue(queueName);
    const job = await queue.add(jobName, data, options);
    logger.debug(`Job "${jobName}" added to queue "${queueName}"`, { jobId: job.id });
    return job;
  }

  async addBulkJobs(
    queueName: string,
    jobs: Array<{ name: string; data: JobData; options?: JobsOptions }>
  ): Promise<Job[]> {
    const queue = this.getQueue(queueName) || this.createQueue(queueName);
    const bulkJobs = jobs.map(job => ({
      name: job.name,
      data: job.data,
      ...job.options,
    }));
    const result = await queue.addBulk(bulkJobs);
    logger.debug(`${jobs.length} jobs added to queue "${queueName}"`);
    return result;
  }

  processJob(
    queueName: string,
    processor: JobProcessor,
    options?: WorkerOptions
  ): Worker {
    const queue = this.getQueue(queueName) || this.createQueue(queueName);
    
    const worker = new Worker(queueName, async (job) => {
      logger.debug(`Processing job "${job.name}"`, { jobId: job.id, queue: queueName });
      return await processor(job);
    }, {
      connection: this.redisOptions as any,
      concurrency: options?.concurrency || 1,
      ...options,
    });

    worker.on('completed', (job) => {
      logger.debug(`Job completed`, { jobId: job.id, queue: queueName });
    });

    worker.on('failed', (job, err) => {
      logger.error(`Job failed`, { jobId: job?.id, queue: queueName, error: err.message });
    });

    worker.on('error', (err) => {
      logger.error(`Worker error`, { queue: queueName, error: err.message });
    });

    this.workers.set(queueName, worker);
    logger.info(`Worker started for queue "${queueName}"`);

    return worker;
  }

  async getJobCounts(queueName: string): Promise<Record<string, number>> {
    const queue = this.getQueue(queueName);
    if (!queue) {
      return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    }
    return await queue.getJobCounts();
  }

  async getJobs(queueName: string, start: number = 0, end: number = 10): Promise<Job[]> {
    const queue = this.getQueue(queueName);
    if (!queue) return [];
    return await queue.getJobs(['waiting', 'active', 'completed', 'failed'], start, end);
  }

  async closeQueue(name: string): Promise<void> {
    const queue = this.queues.get(name);
    if (queue) {
      await queue.close();
      this.queues.delete(name);
      logger.info(`Queue "${name}" closed`);
    }
  }

  async closeWorker(name: string): Promise<void> {
    const worker = this.workers.get(name);
    if (worker) {
      await worker.close();
      this.workers.delete(name);
      logger.info(`Worker for queue "${name}" closed`);
    }
  }

  async closeAll(): Promise<void> {
    await Promise.all([
      ...Array.from(this.queues.values()).map(q => q.close()),
      ...Array.from(this.workers.values()).map(w => w.close()),
    ]);
    this.queues.clear();
    this.workers.clear();
    logger.info('All queues and workers closed');
  }
}

const queueManager = new QueueManager();

export const createQueue = (name: string, options?: Partial<QueueOptions>): Queue => {
  return queueManager.createQueue(name, options);
};

export const addJob = (
  queueName: string,
  jobName: string,
  data: JobData,
  options?: JobsOptions
): Promise<Job> => {
  return queueManager.addJob(queueName, jobName, data, options);
};

export const processJob = (
  queueName: string,
  processor: JobProcessor,
  options?: WorkerOptions
): Worker => {
  return queueManager.processJob(queueName, processor, options);
};

export const queue = {
  create: createQueue,
  add: addJob,
  process: processJob,
  get: (name: string) => queueManager.getQueue(name),
  getJobCounts: (name: string) => queueManager.getJobCounts(name),
  getJobs: (name: string, start?: number, end?: number) => queueManager.getJobs(name, start, end),
  close: (name: string) => queueManager.closeQueue(name),
  closeAll: () => queueManager.closeAll(),
  setRedisOptions: (options: RedisOptions) => queueManager.setRedisOptions(options),
};

export { QueueManager };
export default queue;
