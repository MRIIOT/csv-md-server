import fs from 'fs-extra';
import path from 'path';
import { MarkdownGenerator } from '../services/markdownGenerator.js';
import { logger } from '../utils/logger.js';

export async function handleConvertTool(request, config) {
  const { name, arguments: args } = request.params;
  
  if (name === 'convert_csv_to_markdown') {
    return await handleCSVToMarkdownConversion(args, config);
  }
  
  throw new Error(`Unknown tool: ${name}`);
}

async function handleCSVToMarkdownConversion(args, config) {
  try {
    logger.info('Tool called with args:', { 
      filename: args.filename, 
      output_path: args.output_path,
      csv_data_length: args.csv_data ? args.csv_data.length : 0
    });
    
    const {
      csv_data,
      filename,
      output_path,
      include_headers = true,
      alignment = 'left',
      include_metadata = true,
      table_caption = null,
      max_rows = null
    } = args;

    // Validate inputs
    if (!csv_data || !filename || !output_path) {
      throw new Error('Missing required parameters: csv_data, filename, output_path');
    }

    // Generate markdown content
    const markdownGenerator = new MarkdownGenerator();
    const markdownContent = await markdownGenerator.generateFromCSV(csv_data, {
      filename,
      include_headers,
      alignment,
      include_metadata,
      table_caption,
      max_rows
    });

    // Ensure we have an absolute path
    let absoluteOutputPath = output_path;
    if (!path.isAbsolute(output_path)) {
      // If relative path provided, use config output directory
      absoluteOutputPath = path.join(config.outputDirectory, output_path);
      logger.warn(`Relative output path provided: ${output_path}, using absolute: ${absoluteOutputPath}`);
    }
    
    // Ensure output directory exists
    const outputDir = path.dirname(absoluteOutputPath);
    await fs.ensureDir(outputDir);

    // Write markdown file
    await fs.writeFile(absoluteOutputPath, markdownContent, 'utf-8');

    logger.info(`Successfully converted ${filename} to markdown: ${absoluteOutputPath}`);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Successfully converted ${filename} to markdown table.

Output file: ${output_path}
Generated: ${new Date().toISOString()}

The CSV file has been consumed and converted to a markdown table. The original file has been deleted from the input directory.`
        }
      ]
    };
  } catch (error) {
    logger.error('Error converting CSV to markdown:', error);
    return {
      content: [
        {
          type: 'text',
          text: `❌ Failed to convert CSV to markdown: ${error.message}`
        }
      ],
      isError: true
    };
  }
}