import path from 'path';
import fs from 'fs-extra';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';
import { CSVProcessor } from './csvProcessor.js';

export class ResourceManager extends EventEmitter {
  constructor() {
    super();
    this.resources = new Map();
    this.csvProcessor = new CSVProcessor();
  }

  async addResource(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath);
      const resourceUri = `csv://${fileName}`;

      const resource = {
        uri: resourceUri,
        name: fileName,
        description: `CSV file: ${fileName}`,
        mimeType: 'text/csv',
        metadata: {
          path: filePath,
          lastModified: stats.mtime.toISOString(),
          size: stats.size
        }
      };

      this.resources.set(resourceUri, resource);
      logger.info(`Resource added: ${resourceUri}`);
      this.emit('resourcesChanged');
    } catch (error) {
      logger.error(`Failed to add resource for ${filePath}:`, error);
    }
  }

  async updateResource(filePath) {
    const fileName = path.basename(filePath);
    const resourceUri = `csv://${fileName}`;
    
    if (this.resources.has(resourceUri)) {
      await this.addResource(filePath);
    }
  }

  removeResource(filePath) {
    const fileName = path.basename(filePath);
    const resourceUri = `csv://${fileName}`;
    
    if (this.resources.has(resourceUri)) {
      this.resources.delete(resourceUri);
      logger.info(`Resource removed: ${resourceUri}`);
      this.emit('resourcesChanged');
    }
  }

  getAllResources() {
    return Array.from(this.resources.values());
  }

  getResource(uri) {
    return this.resources.get(uri);
  }

  async consumeResource(uri) {
    const resource = this.resources.get(uri);
    if (!resource) {
      throw new Error(`Resource not found: ${uri}`);
    }

    try {
      // Process the CSV file
      const csvData = await this.csvProcessor.processFile(resource.metadata.path);
      
      // Delete the source file
      await fs.remove(resource.metadata.path);
      
      // Remove from registry
      this.resources.delete(uri);
      this.emit('resourcesChanged');
      
      logger.info(`Resource consumed and file deleted: ${uri}`);
      return csvData;
    } catch (error) {
      logger.error(`Failed to consume resource ${uri}:`, error);
      throw error;
    }
  }
}