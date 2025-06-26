import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
const projectRoot = path.resolve(__dirname, '..', '..');
const envPath = path.join(projectRoot, '.env');
dotenv.config({ path: envPath });

const defaultConfig = {
  watchDirectory: process.env.WATCH_DIRECTORY || path.join(projectRoot, 'input'),
  outputDirectory: process.env.OUTPUT_DIRECTORY || path.join(projectRoot, 'output'),
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB) || 50,
  debounceMs: parseInt(process.env.DEBOUNCE_MS) || 500,
  logLevel: process.env.LOG_LEVEL || 'info',
  fileExtensions: ['.csv'],
  watchSubdirectories: true
};

// Ensure directories exist
await fs.ensureDir(defaultConfig.watchDirectory);
await fs.ensureDir(defaultConfig.outputDirectory);

export const config = defaultConfig;