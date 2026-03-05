import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'auth/index': 'src/auth/index.ts',
    'queue/index': 'src/queue/index.ts',
    'notifications/index': 'src/notifications/index.ts',
    'logger/index': 'src/logger/index.ts',
    'rate-limit/index': 'src/rate-limit/index.ts',
    'config/index': 'src/config/index.ts',
    'response/index': 'src/response/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: false,
  external: ['express', 'fastify', 'ioredis', 'bullmq'],
  treeshake: true,
  exports: {
    namedExports: true,
  },
});
