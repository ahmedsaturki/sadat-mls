interface RequestBatch {
  id: string;
  timestamp: number;
  retryCount: number;
}

type QueueCallback<T> = () => Promise<T>;

class RequestBatcher {
  private batches = new Map<string, RequestBatch>();
  private queue: Array<QueueCallback<unknown>> = [];
  private processing = false;
  private readonly BATCH_SIZE = 5;
  private readonly BATCH_DELAY = 100;

  async add<T>(id: string, fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const existing = this.batches.get(id);
    
    if (existing && now - existing.timestamp < 1000) {
      const batch = existing;
      const delay = Math.min(1000 * Math.pow(2, batch.retryCount), 10000);
      await new Promise(r => setTimeout(r, delay));
      batch.retryCount++;
    }

    this.batches.set(id, { id, timestamp: now, retryCount: 0 });
    return fn();
  }

  private async processBatch() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.BATCH_SIZE);
      await Promise.all(batch.map(fn => fn().catch(e => e)));
      await new Promise(r => setTimeout(r, this.BATCH_DELAY));
    }

    this.processing = false;
  }

  getQueueLength() {
    return this.queue.length;
  }

  clear() {
    this.batches.clear();
    this.queue = [];
  }
}

export const requestBatcher = new RequestBatcher();