import dotenv from 'dotenv';
import path from 'path';
// Resolve .env from the monorepo root regardless of cwd (Turbo runs from apps/api/)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { documentRoutes } from './routes/documents';
import { fieldDefinitionRoutes } from './routes/fieldDefinitions';
import { templateRoutes } from './routes/templates';
import { signRoutes } from './routes/sign';

const app = Fastify({ logger: true });

async function start() {
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  });

  await app.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50 MB
    },
  });

  await app.register(documentRoutes);
  await app.register(fieldDefinitionRoutes);
  await app.register(templateRoutes);
  await app.register(signRoutes);

  app.get('/health', async () => ({ status: 'ok' }));

  const port = parseInt(process.env.PORT ?? '3001', 10);

  try {
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`API server running on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
