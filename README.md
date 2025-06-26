# CSV to Markdown MCP Server

An MCP (Model Context Protocol) server that watches a directory for CSV files, exposes them as resources, and converts them to markdown tables automatically.

## Features

- **Automatic CSV Detection**: Monitors a directory for new CSV files
- **Resource Management**: Exposes CSV files as MCP resources
- **Consume-and-Process Model**: Files are automatically deleted after processing
- **Smart Analysis**: Analyzes CSV structure and data types
- **Markdown Conversion**: Converts CSV data to properly formatted markdown tables
- **Instructional Prompting**: Guides Claude Desktop to automatically process files

## Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd csv-markdown-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env to set your input and output directories
```

## Configuration

Edit the `.env` file to configure:

- `WATCH_DIRECTORY`: Directory to monitor for CSV files
- `OUTPUT_DIRECTORY`: Directory where markdown files will be saved
- `LOG_LEVEL`: Logging level (debug, info, warn, error)
- `MAX_FILE_SIZE_MB`: Maximum file size to process
- `DEBOUNCE_MS`: Debounce time for file changes

## Usage

### Development Mode (with hot reloading):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

### Debug Mode:
```bash
npm run debug
```

## How It Works

1. **File Detection**: The server watches the input directory for CSV files
2. **Resource Registration**: New CSV files are registered as MCP resources
3. **Automatic Processing**: When Claude Desktop accesses a CSV resource:
   - The file is read and analyzed
   - Complete CSV data is embedded in the response
   - An instructional prompt directs Claude to convert it immediately
   - The source file is deleted after reading
4. **Markdown Generation**: Claude executes the conversion tool to create a markdown file
5. **Output**: The markdown file is saved to the output directory

## Integration with Claude Desktop

Add this server to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "csv-markdown": {
      "command": "node",
      "args": ["/path/to/csv-md-server/src/index.js"]
    }
  }
}
```

## Example Workflow

1. Place a CSV file in the watched directory
2. Claude Desktop detects the new resource
3. Access the resource to trigger automatic processing
4. The CSV is converted to markdown and saved
5. Source file is automatically removed

## Important Notes

### Logging
- **No console output**: The server does not output to console to avoid interfering with MCP stdio communication
- **File-based logging**: All logs are written to files in the `logs/` directory
- Check `logs/combined.log` for all server activity
- Check `logs/error.log` for errors only

## Development

### Project Structure:
```
├── src/
│   ├── index.js              # Main server entry
│   ├── config/               # Configuration management
│   ├── services/             # Core services
│   ├── handlers/             # MCP handlers
│   └── utils/                # Utilities
├── logs/                     # Log files
├── input/                    # Watch directory (configurable)
└── output/                   # Output directory (configurable)
```

### Testing:
```bash
npm test
```

### Linting:
```bash
npm run lint
```

## Current Status

The MCP server is fully functional with the following features working:
- ✅ CSV file detection and monitoring
- ✅ Resource registration and management
- ✅ Automatic file consumption (files are deleted after processing)
- ✅ CSV to Markdown conversion
- ✅ Proper output directory handling
- ✅ Instructional prompting for Claude Desktop
- ⚠️ Resource change notifications (implemented but may require manual refresh in Claude Desktop)

## TODO

- [ ] Improve resource change notification support (currently requires manual refresh in Claude Desktop)
- [ ] Add support for custom CSV delimiters (semicolon, tab, etc.)
- [ ] Add configuration for keeping source files instead of deleting them
- [ ] Implement batch processing for multiple CSV files
- [ ] Add support for CSV files with special characters in filenames
- [ ] Create unit tests for core functionality
- [ ] Add GitHub Actions for automated testing
- [ ] Publish to npm registry

## Known Issues

- Resource notifications (`notifications/resources/list_changed`) are sent but may not trigger automatic refresh in current Claude Desktop versions
- Large CSV files may cause memory issues (consider streaming for files > 50MB)

## License

MIT