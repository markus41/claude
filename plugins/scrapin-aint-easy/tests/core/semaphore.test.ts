import { describe, it, expect } from 'vitest';
import { AsyncSemaphore } from '../../src/core/semaphore.js';

describe('AsyncSemaphore', () => {
  it('should enforce max concurrency under load', async () => {
    const sem = new AsyncSemaphore(3);
    let running = 0;
    let maxRunning = 0;

    const worker = async () => {
      await sem.acquire();
      running++;
      maxRunning = Math.max(maxRunning, running);
      await new Promise((r) => setTimeout(r, 50));
      running--;
      sem.release();
    };

    const workers = Array.from({ length: 10 }, () => worker());
    await Promise.all(workers);

    expect(maxRunning).toBe(3);
    expect(running).toBe(0);
  });

  it('should report available slots correctly', () => {
    const sem = new AsyncSemaphore(5);
    expect(sem.available).toBe(5);
  });

  it('should decrement available on acquire', async () => {
    const sem = new AsyncSemaphore(3);
    await sem.acquire();
    expect(sem.available).toBe(2);
    await sem.acquire();
    expect(sem.available).toBe(1);
  });

  it('should increment available on release', async () => {
    const sem = new AsyncSemaphore(3);
    await sem.acquire();
    expect(sem.available).toBe(2);
    sem.release();
    expect(sem.available).toBe(3);
  });

  it('run() should acquire and release automatically', async () => {
    const sem = new AsyncSemaphore(1);
    const result = await sem.run(async () => {
      expect(sem.available).toBe(0);
      return 42;
    });
    expect(result).toBe(42);
    expect(sem.available).toBe(1);
  });

  it('run() should release on error', async () => {
    const sem = new AsyncSemaphore(1);
    await expect(
      sem.run(async () => {
        throw new Error('test error');
      }),
    ).rejects.toThrow('test error');
    expect(sem.available).toBe(1);
  });

  it('should throw if maxConcurrency < 1', () => {
    expect(() => new AsyncSemaphore(0)).toThrow();
    expect(() => new AsyncSemaphore(-1)).toThrow();
  });
});
