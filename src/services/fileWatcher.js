import chokidar from 'chokidar';
import path from 'path';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';

export class FileWatcher {
  constructor(watchDirectory, resourceManager) {
    this.watchDirectory = watchDirectory;
    this.resourceManager = resourceManager;
    this.watcher = null;
    this.debounceTimers = new Map();
  }

  async start() {
    logger.info(`Starting file watcher for directory: ${this.watchDirectory}`);
    
    // Log if directory exists
    try {
      const fs = await import('fs-extra');
      const exists = await fs.pathExists(this.watchDirectory);
      logger.info(`Watch directory exists: ${exists} - ${this.watchDirectory}`);
    } catch (error) {
      logger.error(`Error checking watch directory: ${error.message}`);
    }

    this.watcher = chokidar.watch(this.watchDirectory, {
      ignored: /[\/\\]\./,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100
      },
      // Also process existing files
      ignoreInitial: false
    });

    this.watcher
      .on('add', (filePath) => {
        logger.info(`File added event: ${filePath}`);
        this.handleFileAdded(filePath);
      })
      .on('change', (filePath) => {
        logger.info(`File changed event: ${filePath}`);
        this.handleFileChanged(filePath);
      })
      .on('unlink', (filePath) => {
        logger.info(`File removed event: ${filePath}`);
        this.handleFileRemoved(filePath);
      })
      .on('ready', () => {
        logger.info('File watcher is ready and watching for changes');
      })
      .on('error', (error) => {
        logger.error('File watcher error:', error);
      });

    logger.info(`File watcher initialized for: ${this.watchDirectory}`);
  }

  async stop() {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
  }

  handleFileAdded(filePath) {
    logger.info(`Checking if file is CSV: ${filePath}`);
    if (this.isCSVFile(filePath)) {
      logger.info(`File is CSV, debouncing operation for: ${filePath}`);
      this.debounceFileOperation(filePath, () => {
        logger.info(`CSV file detected after debounce: ${filePath}`);
        this.resourceManager.addResource(filePath);
      });
    } else {
      logger.info(`File is not CSV (extension check failed): ${filePath}`);
    }
  }

  handleFileChanged(filePath) {
    if (this.isCSVFile(filePath)) {
      this.debounceFileOperation(filePath, () => {
        logger.info(`CSV file modified: ${filePath}`);
        this.resourceManager.updateResource(filePath);
      });
    }
  }

  handleFileRemoved(filePath) {
    if (this.isCSVFile(filePath)) {
      logger.info(`CSV file removed: ${filePath}`);
      this.resourceManager.removeResource(filePath);
    }
  }

  isCSVFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return config.fileExtensions.includes(ext);
  }

  debounceFileOperation(filePath, operation) {
    // Clear existing timer
    if (this.debounceTimers.has(filePath)) {
      clearTimeout(this.debounceTimers.get(filePath));
    }

    // Set new timer
    const timer = setTimeout(() => {
      operation();
      this.debounceTimers.delete(filePath);
    }, config.debounceMs);

    this.debounceTimers.set(filePath, timer);
  }
}