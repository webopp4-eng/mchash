/**
 * MC Hash — staged HTTP load tester (zero dependencies).
 *
 * Usage:
 *   node load-test.js [baseUrl] [stage1,stage2,...] [secondsPerStage]
 *   node load-test.js http://localhost:4000 50,100,250,500,1000,2500,5000 20
 *
 * Each stage runs `concurrency` virtual users performing a realistic mixed
 * read workload (health / plans / market-prices / auth-guarded endpoint)
 * for `secondsPerStage` seconds. Reports p50/p95/p99 latency, error rate,
 * and throughput per stage. CPU/RAM of the server should be observed
 * separately (Render metrics or `docker stats`) while this runs.
 */
const http = require('http');
const https = require('https');

const BASE = process.argv[2] || 'http://localhost:4000';
const STAGES = (process.argv[3] || '50,100,250,500,1000,2500,5000').split(',').map(Number);
const DURATION_S = Number(process.argv[4] || 20);

// Endpoint mix can be overridden, e.g.:
//   set LOAD_ENDPOINTS=/api/health:2,/api/market-prices:3,/api/dashboard:1
const ENDPOINTS = (process.env.LOAD_ENDPOINTS || '/api/health:2,/api/plans:3,/api/market-prices:3,/api/dashboard:1')
  .split(',')
  .map((entry) => {
    const [path, weight] = entry.split(':');
    return { path, weight: Number(weight || 1) };
  });

function pickEndpoint() {
  const total = ENDPOINTS.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of ENDPOINTS) {
    r -= e.weight;
    if (r <= 0) return e.path;
  }
  return ENDPOINTS[0].path;
}

function requestOnce(path) {
  return new Promise((resolve) => {
    const start = process.hrtime.bigint();
    const mod = BASE.startsWith('https') ? https : http;
    const req = mod.get(BASE + path, { timeout: 15000 }, (res) => {
      res.resume();
      res.on('end', () => {
        const ms = Number(process.hrtime.bigint() - start) / 1e6;
        resolve({ ms, status: res.statusCode });
      });
    });
    req.on('timeout', () => { req.destroy(); resolve({ ms: 15000, status: 0 }); });
    req.on('error', () => resolve({ ms: Number(process.hrtime.bigint() - start) / 1e6, status: 0 }));
  });
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

async function runStage(concurrency, durationS) {
  const latencies = [];
  const statusCounts = {};
  let completed = 0;
  let errors = 0;
  const deadline = Date.now() + durationS * 1000;

  async function worker() {
    while (Date.now() < deadline) {
      const r = await requestOnce(pickEndpoint());
      latencies.push(r.ms);
      completed++;
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
      if (r.status === 0 || r.status >= 500) errors++;
    }
  }

  const start = Date.now();
  await Promise.all(Array.from({ length: concurrency }, worker));
  const elapsedS = (Date.now() - start) / 1000;

  latencies.sort((a, b) => a - b);
  const p50 = percentile(latencies, 50).toFixed(1);
  const p95 = percentile(latencies, 95).toFixed(1);
  const p99 = percentile(latencies, 99).toFixed(1);
  const avg = (latencies.reduce((a, b) => a + b, 0) / Math.max(1, latencies.length)).toFixed(1);
  const errorRate = ((errors / Math.max(1, completed)) * 100).toFixed(2);
  const rps = (completed / elapsedS).toFixed(1);

  console.log(
    `  ${String(concurrency).padStart(5)} users | ${String(completed).padStart(7)} req | ` +
    `avg ${avg}ms | p50 ${p50}ms | p95 ${p95}ms | p99 ${p99}ms | ` +
    `${rps} rps | errors ${errorRate}% | statuses ${JSON.stringify(statusCounts)}`
  );
  return { concurrency, completed, avg: Number(avg), p50: Number(p50), p95: Number(p95), p99: Number(p99), rps: Number(rps), errorRate: Number(errorRate) };
}

(async () => {
  console.log(String.fromCharCode(10) + '=== MC HASH LOAD TEST ===');
  console.log(`Target: ${BASE}`);
  console.log(`Stages: ${STAGES.join(', ')} concurrent users × ${DURATION_S}s each` + String.fromCharCode(10));
  console.log('  Stage     | Requests | Latency (avg/p50/p95/p99)              | Throughput | Errors');

  const results = [];
  for (const stage of STAGES) {
    results.push(await runStage(stage, DURATION_S));
    await new Promise((r) => setTimeout(r, 3000)); // cool-down between stages
  }

  console.log(String.fromCharCode(10) + '=== SUMMARY ===');
  for (const r of results) {
    const verdict =
      r.errorRate > 5 ? 'FAIL' :
      r.p95 > 2000 ? 'DEGRADED' : 'PASS';
    console.log(`  ${String(r.concurrency).padStart(5)} users → ${verdict} (${r.rps} rps, p95 ${r.p95}ms, errors ${r.errorRate}%)`);
  }
})();