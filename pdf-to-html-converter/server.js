import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir, writeFile, readFile, readdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;
const CONVERTED_DIR = join(__dirname, 'converted');
const METADATA_FILE = join(CONVERTED_DIR, 'metadata.json');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from converted directory
app.use('/converted', express.static(CONVERTED_DIR));

// Serve story-viewer.html
app.get('/story-viewer.html', (req, res) => {
  res.sendFile(join(__dirname, 'src', 'story-viewer.html'));
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, 'dist');
  app.use(express.static(distPath));

  // Catch-all route to serve index.html for SPA
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api') || req.path.startsWith('/converted') || req.path === '/story-viewer.html') {
      return next();
    }
    res.sendFile(join(distPath, 'index.html'));
  });
}

// Ensure converted directory exists
if (!existsSync(CONVERTED_DIR)) {
  await mkdir(CONVERTED_DIR, { recursive: true });
}

// Ensure metadata file exists
if (!existsSync(METADATA_FILE)) {
  await writeFile(METADATA_FILE, JSON.stringify([]), 'utf-8');
}

// Helper functions for metadata
async function getMetadata() {
  try {
    const data = await readFile(METADATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveMetadata(metadata) {
  await writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2), 'utf-8');
}

// Save HTML file with metadata
app.post('/api/save-html', async (req, res) => {
  try {
    const { fileName, htmlContent, metadata } = req.body;

    if (!fileName || !htmlContent) {
      return res.status(400).json({ error: 'fileName and htmlContent are required' });
    }

    const filePath = join(CONVERTED_DIR, fileName);
    await writeFile(filePath, htmlContent, 'utf-8');

    // Save metadata if provided
    if (metadata) {
      const allMetadata = await getMetadata();
      const newEntry = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        htmlFileName: fileName,
        originalFileName: metadata.originalFileName || fileName,
        pageCount: metadata.pageCount || 0,
        fileSize: metadata.fileSize || 0,
        convertedAt: new Date().toISOString(),
        tags: metadata.tags || [],
        notes: metadata.notes || '',
        savedToServer: true
      };
      allMetadata.unshift(newEntry);
      await saveMetadata(allMetadata);
    }

    res.json({
      success: true,
      message: 'File saved successfully',
      path: filePath,
      fileName: fileName
    });
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ error: 'Failed to save file', details: error.message });
  }
});

// Get all metadata
app.get('/api/metadata', async (req, res) => {
  try {
    const metadata = await getMetadata();
    res.json({
      success: true,
      metadata: metadata
    });
  } catch (error) {
    console.error('Error getting metadata:', error);
    res.status(500).json({ error: 'Failed to get metadata', details: error.message });
  }
});

// Update metadata entry
app.put('/api/metadata/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const metadata = await getMetadata();
    const index = metadata.findIndex(item => item.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Metadata entry not found' });
    }

    metadata[index] = { ...metadata[index], ...updates };
    await saveMetadata(metadata);

    res.json({
      success: true,
      message: 'Metadata updated successfully',
      metadata: metadata[index]
    });
  } catch (error) {
    console.error('Error updating metadata:', error);
    res.status(500).json({ error: 'Failed to update metadata', details: error.message });
  }
});

// Delete metadata entry and file
app.delete('/api/metadata/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const metadata = await getMetadata();
    const entry = metadata.find(item => item.id === id);

    if (!entry) {
      return res.status(404).json({ error: 'Metadata entry not found' });
    }

    // Remove from metadata (no HTML files to delete in new architecture)
    const filtered = metadata.filter(item => item.id !== id);
    await saveMetadata(filtered);

    res.json({
      success: true,
      message: 'Book data deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: 'Failed to delete entry', details: error.message });
  }
});

// Clear all metadata and files
app.delete('/api/metadata', async (req, res) => {
  try {
    // Clear metadata (no HTML files to delete in new architecture)
    await saveMetadata([]);

    res.json({
      success: true,
      message: 'All book data cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ error: 'Failed to clear data', details: error.message });
  }
});

// Get HTML file content
app.get('/api/get-html/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = join(CONVERTED_DIR, fileName);

    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const content = await readFile(filePath, 'utf-8');
    res.json({
      success: true,
      fileName: fileName,
      content: content
    });
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: 'Failed to read file', details: error.message });
  }
});

// List all HTML files
app.get('/api/list-files', async (req, res) => {
  try {
    const files = await readdir(CONVERTED_DIR);
    const htmlFiles = files.filter(file => file.endsWith('.html'));

    res.json({
      success: true,
      files: htmlFiles
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files', details: error.message });
  }
});

// Delete HTML file
app.delete('/api/delete-html/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = join(CONVERTED_DIR, fileName);

    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    await unlink(filePath);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file', details: error.message });
  }
});

// Serve HTML files directly
app.get('/api/view/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = join(CONVERTED_DIR, fileName);

    if (!existsSync(filePath)) {
      return res.status(404).send('File not found');
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).send('Failed to serve file');
  }
});

// Save book data to metadata.json
app.post('/api/save-book', async (req, res) => {
  try {
    const bookData = req.body;

    if (!bookData || !bookData.id) {
      return res.status(400).json({ error: 'Invalid book data' });
    }

    const metadata = await getMetadata();

    // Check if book already exists
    const existingIndex = metadata.findIndex(item => item.id === bookData.id);

    if (existingIndex >= 0) {
      // Update existing book
      metadata[existingIndex] = { ...metadata[existingIndex], ...bookData };
    } else {
      // Add new book to the beginning
      metadata.unshift(bookData);
    }

    await saveMetadata(metadata);

    res.json({
      success: true,
      message: 'Book data saved successfully',
      id: bookData.id
    });
  } catch (error) {
    console.error('Error saving book data:', error);
    res.status(500).json({ error: 'Failed to save book data', details: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`✅ File server running on http://localhost:${PORT}`);
  console.log(`📁 Saving files to: ${CONVERTED_DIR}`);
});
