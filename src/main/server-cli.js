// Run the Pixel Office server without Electron (preview in a browser, screenshots, tests).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './server.js';
import { createRegistry } from './houses.js';
import { DEFAULT_PORT } from '../shared/protocol.js';

const staticDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'renderer');
const port = Number(process.env.PIXEL_OFFICE_PORT) || DEFAULT_PORT;
const srv = await startServer({ port, staticDir, registry: createRegistry() });
console.log(`Pixel Office preview: http://127.0.0.1:${srv.port}/?scale=3`);
