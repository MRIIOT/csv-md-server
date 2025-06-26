#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema, 
  ListResourcesRequestSchema, 
  ReadResourceRequestSchema,
  ListToolsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import { config } from './config/config.js';
import { FileWatcher } from './services/fileWatcher.js';
import { ResourceManager } from './services/resourceManager.js';
import { handleListResources, handleReadResource } from './handlers/resourceHandler.js';
import { handleConvertTool } from './handlers/toolHandler.js';
import { logger } from './utils/logger.js';

class CSVMarkdownMCPServer {
  constructor() {
    this.server = new Server({
      name: 'csv-markdown-mcp-server',
      version: '1.0.0'
    }, {
      capabilities: {
        resources: {},
        tools: {}
      }
    });

    this.resourceManager = new ResourceManager();
    this.fileWatcher = new FileWatcher(config.watchDirectory, this.resourceManager);
    this.transport = null;
    
    // Set up resource change notifications
    this.resourceManager.on('resourcesChanged', () => {
      logger.info('Resources changed event received');
      this.notifyResourcesChanged();
    });
    
    this.setupHandlers();
  }

  setupHandlers() {
    // Tool list handler
    this.server.setRequestHandler(ListToolsRequestSchema, () => ({
      tools: [{
        name: 'convert_csv_to_markdown',
        description: 'Convert CSV data to a markdown table and save to output directory',
        inputSchema: {
          type: 'object',
          properties: {
            csv_data: {
              type: 'string',
              description: 'Complete CSV content as string (from consumed file)'
            },
            filename: {
              type: 'string',
              description: 'Original filename for the output .md file'
            },
            output_path: {
              type: 'string',
              description: 'Full path where markdown file should be saved'
            },
            include_headers: {
              type: 'boolean',
              default: true,
              description: 'Include headers in the table'
            },
            alignment: {
              type: 'string',
              enum: ['left', 'center', 'right'],
              default: 'left',
              description: 'Table column alignment'
            },
            max_rows: {
              type: 'integer',
              description: 'Maximum rows to include (null for all)'
            },
            table_caption: {
              type: 'string',
              description: 'Optional table caption'
            },
            include_metadata: {
              type: 'boolean',
              default: true,
              description: 'Include metadata in output'
            }
          },
          required: ['csv_data', 'filename', 'output_path']
        }
      }]
    }));

    // Resource handlers
    this.server.setRequestHandler(ListResourcesRequestSchema, () => 
      handleListResources(this.resourceManager)
    );

    this.server.setRequestHandler(ReadResourceRequestSchema, (request) =>
      handleReadResource(request, this.resourceManager, config)
    );

    // Tool handlers  
    this.server.setRequestHandler(CallToolRequestSchema, (request) =>
      handleConvertTool(request, config)
    );
  }

  async start() {
    try {
      // Log configuration
      logger.info(`Configuration loaded:`);
      logger.info(`- Watch Directory: ${config.watchDirectory}`);
      logger.info(`- Output Directory: ${config.outputDirectory}`);
      logger.info(`- Project Root: ${process.cwd()}`);
      
      // Start file watcher
      await this.fileWatcher.start();
      logger.info(`File watcher started for directory: ${config.watchDirectory}`);

      // Start MCP server
      this.transport = new StdioServerTransport();
      await this.server.connect(this.transport);
      logger.info('MCP Server started successfully');

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async stop() {
    await this.fileWatcher.stop();
    logger.info('Server stopped');
  }

  async notifyResourcesChanged() {
    // Send notification to client that resources have changed
    try {
      // Try using the server's internal notification method if it exists
      if (this.server._transport && this.server._transport.send) {
        const notification = {
          jsonrpc: '2.0',
          method: 'notifications/resources/list_changed'
        };
        this.server._transport.send(notification);
        logger.info('Sent resource list changed notification via server transport');
      } else if (this.transport && this.transport.send) {
        const notification = {
          jsonrpc: '2.0',
          method: 'notifications/resources/list_changed'
        };
        await this.transport.send(notification);
        logger.info('Sent resource list changed notification via stored transport');
      } else {
        logger.warn('No transport available to send notification');
      }
    } catch (error) {
      logger.error('Failed to send resource notification:', error);
    }
  }
}

// Start server
const server = new CSVMarkdownMCPServer();

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

server.start();