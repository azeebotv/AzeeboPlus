#!/usr/bin/env node
/**
 * Minimal S3-compatible blob sink for local development.
 *
 * Implements just enough of the S3 REST API (PutObject / HeadObject /
 * GetObject / DeleteObject) for services configured with
 * `S3_ENDPOINT=http://127.0.0.1:9000` to store and read real objects
 * without AWS credentials or Docker. Objects are written under
 * AZEEBO_BLOB_DIR (default /tmp/azeebo-dev-blob) as `<bucket>/<key>`.
 *
 * Usage: node scripts/dev-blob-server.mjs   (PORT=9000 by default)
 * This is a DEV TOOL: it performs no authentication and no durability.
 */
import { createServer } from 'node:http';
import { mkdir, writeFile, readFile, stat, unlink, mkdir as mk } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const PORT = Number(process.env.PORT || 9000);
const ROOT = resolve(process.env.AZEEBO_BLOB_DIR || '/tmp/azeebo-dev-blob');

await mk(ROOT, { recursive: true });

const server = createServer(async (req, res) => {
  try {
    // Path form: /{bucket}/{key...}
    const url = new URL(req.url, `http://${req.headers.host}`);
    const parts = decodeURIComponent(url.pathname).split('/').filter(Boolean);
    if (parts.length < 2) {
      res.writeHead(400).end('expected /{bucket}/{key}');
      return;
    }
    const [bucket, ...keyParts] = parts;
    if (!/^[\w.-]+$/.test(bucket)) {
      res.writeHead(400).end('invalid bucket');
      return;
    }
    const key = keyParts.join('/');
    const objectPath = join(ROOT, bucket, key);
    if (!objectPath.startsWith(join(ROOT, bucket))) {
      res.writeHead(400).end('invalid key');
      return;
    }

    if (req.method === 'PUT') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = Buffer.concat(chunks);
      await mkdir(dirname(objectPath), { recursive: true });
      await writeFile(objectPath, body);
      res.writeHead(200, { ETag: `"${body.length.toString(16)}"` }).end();
      return;
    }

    if (req.method === 'HEAD') {
      try {
        const s = await stat(objectPath);
        res.writeHead(200, { 'Content-Length': s.size }).end();
      } catch {
        res.writeHead(404).end();
      }
      return;
    }

    if (req.method === 'GET') {
      try {
        const data = await readFile(objectPath);
        res.writeHead(200, { 'Content-Length': data.length }).end(data);
      } catch {
        res.writeHead(404).end();
      }
      return;
    }

    if (req.method === 'DELETE') {
      await unlink(objectPath).catch(() => {});
      res.writeHead(204).end();
      return;
    }

    res.writeHead(405).end();
  } catch (err) {
    res.writeHead(500).end(String(err?.message || err));
  }
});

server.listen(PORT, () => {
  console.log(`[dev-blob-server] S3-compatible sink on http://127.0.0.1:${PORT} → ${ROOT}`);
});
