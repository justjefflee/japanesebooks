# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React web application that converts PDF files to HTML format. It's built with Vite and uses PDF.js for PDF processing.

## Development Commands

```bash
# Start development server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm preview

# Lint code
npm run lint
```

## Core Architecture

### PDF Conversion Flow

1. **File Upload** → User drops/selects PDFs → `App.jsx` manages file state
2. **Conversion** → Files sent to `convertPdfToHtml()` → `src/utils/pdfConverter.js`
3. **Processing** → PDF.js renders each page as canvas → Converts to base64 PNG
4. **Text Extraction** → PDF.js extracts text content from each page
5. **HTML Generation** → Creates standalone HTML with embedded images and extracted text
6. **Output** → Returns HTML string with metadata (pageCount, fileName)

### Key Components

**`src/App.jsx`** - Main application component
- Manages all state (files, conversion results, preview)
- Handles drag-and-drop file upload
- Orchestrates batch conversion process
- Provides preview modal and download functionality
- Downloads single files or creates ZIP archives for batch downloads

**`src/utils/pdfConverter.js`** - Core conversion logic
- Configures PDF.js worker (uses local worker from node_modules, not CDN)
- Processes PDF files page by page
- Renders pages as high-quality images (scale: 2.0)
- Extracts text content for searchability
- Generates complete HTML documents with embedded styling

### Critical Implementation Details

#### PDF.js Worker Configuration
The worker MUST use the local file from node_modules:
```javascript
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();
```
Do NOT use CDN URLs - they will fail with CORS/import errors in Vite.

#### HTML Output Structure
Generated HTML includes:
- Inline CSS for consistent styling
- Each page as a base64-encoded PNG image
- Extracted text content below each page image
- Page numbers and metadata
- `lang="ja"` attribute (supports multi-language, especially Japanese PDFs)

#### State Management Pattern
All state is lifted to App.jsx:
- `files`: Array of File objects selected for conversion
- `results`: Array of conversion results with {html, fileName, success, pageCount, originalFileName}
- `converting`: Boolean tracking conversion progress
- `previewHtml`: String of HTML to preview in modal

## Dependencies

### Production
- **pdfjs-dist**: PDF parsing and rendering
- **jszip**: Creating ZIP archives for batch downloads
- **file-saver**: Handling file downloads in browser
- **react + react-dom**: UI framework

### Development
- **vite**: Build tool (v5.4.x compatible with Node 20.3.1)
- **@vitejs/plugin-react**: React Fast Refresh support
- **eslint**: Code linting

## Node.js Version Compatibility

This project uses Vite 5.4.x which is compatible with Node.js 20.3.1. If upgrading Vite to v7+, it requires Node.js 20.19+ or 22.12+.

## Common Development Patterns

### Adding New Features
1. Add state management to App.jsx if needed
2. Create utility functions in src/utils/ for complex logic
3. Update App.css for styling
4. Test with multi-page and multi-language PDFs

### Testing PDFs
Test PDF location: `/Users/jefflee/dev/japanesebooks/download/R_L1_Kore_wa_nan_desu_ka_II.pdf`
This is a Japanese children's book PDF used for initial development and testing.

## Future Enhancement Areas

The user has requested adding a conversion history feature to organize converted files. When implementing this:
- Use localStorage to persist conversion history
- Store metadata (filename, conversion date, pageCount) but NOT the full HTML (too large)
- Store reference to where HTML was downloaded or provide re-conversion capability
- Add search/filter functionality for managing large lists
- Consider adding tags or notes for organization
