/** Pool de concurrencia simple, sin dependencias. */
export async function pool(items, worker, { concurrency = 4, onProgress } = {}) {
  const results = new Array(items.length);
  let next = 0;
  let done = 0;
  const total = items.length;

  async function run() {
    for (;;) {
      const i = next++;
      if (i >= total) return;
      try {
        results[i] = await worker(items[i], i);
      } catch (e) {
        results[i] = { __error: e.message || String(e) };
      }
      done++;
      if (onProgress) {
        try { onProgress(done, total, items[i], results[i]); } catch {}
      }
    }
  }

  const n = Math.max(1, Math.min(concurrency, total || 1));
  await Promise.all(Array.from({ length: n }, run));
  return results;
}
