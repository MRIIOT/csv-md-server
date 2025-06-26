import { parse } from 'csv-parse/sync';

export class MarkdownGenerator {
  async generateFromCSV(csvData, options = {}) {
    const {
      filename,
      include_headers = true,
      alignment = 'left',
      include_metadata = true,
      table_caption = null,
      max_rows = null
    } = options;

    // Parse CSV data
    const records = parse(csvData, {
      columns: include_headers,
      skip_empty_lines: true,
      trim: true
    });

    // Build markdown content
    let markdown = '';

    // Add metadata header
    if (include_metadata) {
      markdown += `# Table: ${filename}\n\n`;
      markdown += `*Generated: ${new Date().toISOString()}*\n`;
      markdown += `*Rows: ${records.length} | Columns: ${Object.keys(records[0] || {}).length}*\n\n`;
    }

    // Add caption if provided
    if (table_caption) {
      markdown += `${table_caption}\n\n`;
    }

    // Generate table
    if (records.length > 0) {
      const headers = Object.keys(records[0]);
      const limitedRecords = max_rows ? records.slice(0, max_rows) : records;

      // Table headers
      markdown += '| ' + headers.join(' | ') + ' |\n';
      
      // Alignment row
      const alignChar = alignment === 'center' ? ':---:' : alignment === 'right' ? '---:' : ':---';
      markdown += '|' + headers.map(() => alignChar).join('|') + '|\n';

      // Table rows
      limitedRecords.forEach(row => {
        const cells = headers.map(header => {
          const cellValue = (row[header] || '').toString();
          // Escape pipe characters and trim whitespace
          return cellValue.replace(/\|/g, '\\|').trim();
        });
        markdown += '| ' + cells.join(' | ') + ' |\n';
      });

      // Add truncation note if max_rows was applied
      if (max_rows && records.length > max_rows) {
        markdown += `\n*Note: Table truncated to ${max_rows} rows. Total rows in source: ${records.length}*\n`;
      }
    } else {
      markdown += '*No data available in CSV file*\n';
    }

    return markdown;
  }
}