import fs from 'fs-extra';
import { parse } from 'csv-parse/sync';
import { logger } from '../utils/logger.js';

export class CSVProcessor {
  async processFile(filePath) {
    try {
      // Read the complete file
      const fileContent = await fs.readFile(filePath, 'utf-8');
      
      // Parse CSV
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      // Analyze the data
      const analysis = this.analyzeData(records, fileContent);
      
      // Generate preview
      const preview = this.generatePreview(records);
      
      return {
        content: fileContent,
        records: records,
        analysis: analysis,
        preview: preview,
        originalPath: filePath
      };
    } catch (error) {
      logger.error(`Failed to process CSV file ${filePath}:`, error);
      throw error;
    }
  }

  analyzeData(records, rawContent) {
    const headers = Object.keys(records[0] || {});
    const rowCount = records.length;
    const columnCount = headers.length;
    
    // Analyze data types for each column
    const dataTypes = headers.map(header => {
      const sampleValues = records.slice(0, 10).map(row => row[header]).filter(val => val !== '');
      const type = this.detectDataType(sampleValues);
      return { column: header, type };
    });

    return {
      headers,
      rowCount,
      columnCount,
      dataTypes
    };
  }

  detectDataType(values) {
    if (values.length === 0) return 'Unknown';
    
    const numericCount = values.filter(val => !isNaN(parseFloat(val)) && isFinite(val)).length;
    const dateCount = values.filter(val => !isNaN(Date.parse(val))).length;
    
    if (numericCount / values.length > 0.8) {
      return values.some(val => val.includes('.')) ? 'Numeric (Float)' : 'Numeric (Integer)';
    } else if (dateCount / values.length > 0.8) {
      return 'Date';
    } else if (new Set(values).size < values.length * 0.5) {
      return 'Categorical';
    } else {
      return 'Text';
    }
  }

  generatePreview(records) {
    if (records.length === 0) return 'No data available';
    
    const headers = Object.keys(records[0]);
    const previewRows = records.slice(0, 3);
    
    // Generate markdown table preview
    let preview = '| ' + headers.join(' | ') + ' |\n';
    preview += '|' + headers.map(() => '------').join('|') + '|\n';
    
    previewRows.forEach(row => {
      const cells = headers.map(header => (row[header] || '').toString().replace(/\|/g, '\\|'));
      preview += '| ' + cells.join(' | ') + ' |\n';
    });
    
    return preview;
  }
}