import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
const cli = join(dirname(require.resolve('vitest/package.json')), 'vitest.mjs');
const run = spawnSync(process.execPath, [cli, 'run', 'src/services/demo-evaluation.test.ts'], {
  stdio: 'inherit', env: { ...process.env, DEMO_REPORT: '1' },
});
if (run.error) throw run.error;
process.exit(run.status ?? 1);
