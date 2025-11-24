# PDF to HTML Converter

A React web application that converts PDF files to HTML format, preserving text content and images.

## Features

- 📤 **Drag & Drop Upload**: Simply drag and drop your PDF files or click to browse
- 📦 **Batch Processing**: Convert multiple PDF files at once
- 👀 **Live Preview**: Preview the converted HTML before downloading
- 💾 **Download Options**: Download individual files or all as a ZIP archive
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🎨 **Visual Preservation**: Converts each page to an image and extracts text content
- 🌏 **Multi-language Support**: Works with PDFs in any language, including Japanese

## Getting Started

### Prerequisites

- Node.js (v20 or higher recommended)
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd pdf-to-html-converter
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit the URL shown in the terminal (usually `http://localhost:5173`)

## How to Use

1. **Upload PDFs**:
   - Drag and drop PDF files onto the upload area, or
   - Click the upload area to browse and select files

2. **Convert**:
   - Click the "Convert" button to start the conversion process
   - Watch the progress bar as files are being converted

3. **Preview & Download**:
   - Once converted, you'll see a list of results
   - Click "Preview" to view the HTML in your browser
   - Click "Download" to save individual HTML files
   - Click "Download All" to get all files in a ZIP archive

## Technical Details

### Conversion Process

The converter:
1. Reads the PDF file using PDF.js
2. Renders each page as a high-resolution image
3. Extracts text content from each page
4. Generates a standalone HTML file with embedded images
5. Includes CSS styling for a clean, readable output

### Output Format

Each converted HTML file includes:
- Embedded page images (as base64 data URLs)
- Extracted text content
- Responsive styling
- Page numbers and navigation

### Technologies Used

- **React**: UI framework
- **Vite**: Build tool and dev server
- **PDF.js**: PDF parsing and rendering
- **JSZip**: Creating ZIP archives for batch downloads
- **FileSaver.js**: Handling file downloads

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory, ready to be deployed to any static hosting service.

## Example Use Cases

- Converting educational materials for web viewing
- Digitizing printed documents
- Creating web-accessible versions of PDF content
- Extracting text and images from PDF files
- Batch processing document collections

## Browser Compatibility

Works on all modern browsers that support:
- ES6+ JavaScript
- Canvas API
- File API
- Web Workers

## License

MIT License - feel free to use this project for any purpose.

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.
