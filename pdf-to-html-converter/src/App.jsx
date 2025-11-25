import { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { convertPdfToHtml, convertTxtToHtml } from './utils/pdfConverter';
import { saveHtmlToServer, checkServerHealth, saveBookData } from './utils/fileApi';
import Library from './components/Library';
import Translation from './components/Translation';
import './App.css';

function App() {
  const [files, setFiles] = useState([]);
  const [converting, setConverting] = useState(false);
  const [results, setResults] = useState([]);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [previewFileName, setPreviewFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [currentView, setCurrentView] = useState('library'); // 'library' or 'converter'
  const [serverOnline, setServerOnline] = useState(false);

  useEffect(() => {
    // Check server health on mount
    checkServerHealth().then(setServerOnline);
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf' || file.type === 'text/plain' || file.name.endsWith('.txt')
    );

    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const convertAll = async () => {
    if (files.length === 0) return;

    setConverting(true);
    setResults([]);
    const newResults = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Detect file type and use appropriate converter
      const result = file.name.endsWith('.txt')
        ? await convertTxtToHtml(file)
        : await convertPdfToHtml(file);
      newResults.push(result);
      setResults([...newResults]);

      // Automatically save to server after conversion
      console.log('Conversion result:', { success: result.success, hasData: !!result.data, serverOnline });
      if (result.success && serverOnline && result.data) {
        try {
          console.log('Attempting to save book data:', result.data.title);
          const saveResult = await saveBookData(result.data);
          console.log('✅ Book data saved to server:', result.data.title, saveResult);
        } catch (error) {
          console.error('❌ Failed to save to server:', error);
          alert('Failed to save book data: ' + error.message);
        }
      } else {
        if (!result.success) console.log('Conversion failed');
        if (!serverOnline) console.log('Server is offline');
        if (!result.data) console.log('No data in result');
      }
    }

    setConverting(false);
  };

  const openStoryViewer = () => {
    // Open the story viewer in a new tab
    window.open('http://localhost:3001/story-viewer.html', '_blank');
  };

  const downloadMetadata = async () => {
    // Download the metadata.json file
    try {
      const response = await fetch('http://localhost:3001/converted/metadata.json');
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      saveAs(blob, 'metadata.json');
    } catch (error) {
      console.error('Failed to download metadata:', error);
      alert('Failed to download metadata file');
    }
  };

  const previewResult = (bookData) => {
    // For now, just show a message that data was saved
    alert(`Book "${bookData.title}" has been saved to the library!\n\nClick "View in Story Viewer" to see it.`);
  };

  const closePreview = () => {
    setPreviewHtml(null);
    setPreviewFileName('');
  };

  const handleReconvert = async (historyItem) => {
    // Just open the story viewer - all books are accessible there
    window.open('http://localhost:3001/story-viewer.html', '_blank');
  };

  // Show Library, Converter, or Translation based on currentView
  if (currentView === 'library') {
    return (
      <div className="app">
        <Library
          onClose={() => {}} // Not used as modal anymore
          onReconvert={handleReconvert}
          onNavigateToConverter={() => setCurrentView('converter')}
          onNavigateToTranslation={() => setCurrentView('translation')}
        />
        {previewHtml && (
          <div className="preview-modal" onClick={closePreview}>
            <div className="preview-content" onClick={(e) => e.stopPropagation()}>
              <div className="preview-header">
                <h3>{previewFileName}</h3>
                <button className="close-btn" onClick={closePreview}>×</button>
              </div>
              <div className="preview-body">
                <iframe
                  srcDoc={previewHtml}
                  title="HTML Preview"
                  sandbox="allow-same-origin"
                />
              </div>
              <div className="preview-footer">
                <button
                  className="download-btn"
                  onClick={() => downloadSingle(previewHtml, previewFileName)}
                >
                  Download HTML
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (currentView === 'translation') {
    return (
      <div className="app">
        <Translation onNavigateToLibrary={() => setCurrentView('library')} />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-text">
            <h1>📄 PDF & TXT Converter</h1>
            <p>Convert your PDF and TXT files with automatic translation</p>
          </div>
          <button className="library-btn" onClick={() => setCurrentView('library')}>
            ← Back to Library
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="upload-section">
          <div
            className={`drop-zone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput').click()}
          >
            <div className="drop-zone-content">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="17 8 12 3 7 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="3" x2="12" y2="15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="drop-zone-title">Drag & drop PDF or TXT files here</p>
              <p className="drop-zone-subtitle">or click to browse</p>
              <input
                id="fileInput"
                type="file"
                accept=".pdf,.txt"
                multiple
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {files.length > 0 && (
            <div className="file-list">
              <h3>Selected Files ({files.length})</h3>
              {files.map((file, index) => (
                <div key={index} className="file-item">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <button
                    className="remove-btn"
                    onClick={() => removeFile(index)}
                    disabled={converting}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {files.length > 0 && (
            <div className="action-buttons">
              <button
                className="convert-btn"
                onClick={convertAll}
                disabled={converting}
              >
                {converting ? 'Converting...' : `Convert ${files.length} File${files.length > 1 ? 's' : ''}`}
              </button>
              {!converting && (
                <button
                  className="clear-btn"
                  onClick={() => {
                    setFiles([]);
                    setResults([]);
                  }}
                >
                  Clear All
                </button>
              )}
            </div>
          )}
        </div>

        {converting && (
          <div className="progress-section">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(results.length / files.length) * 100}%` }}
              />
            </div>
            <p>Converting: {results.length} of {files.length} files</p>
          </div>
        )}

        {results.length > 0 && !converting && (
          <div className="results-section">
            <div className="results-header">
              <h3>Conversion Results</h3>
              {results.some(r => r.success) && (
                <button className="download-all-btn" onClick={openStoryViewer}>
                  📖 View in Story Viewer
                </button>
              )}
            </div>
            <div className="results-list">
              {results.map((result, index) => (
                <div key={index} className={`result-item ${result.success ? 'success' : 'error'}`}>
                  <div className="result-info">
                    <span className="result-icon">{result.success ? '✓' : '✗'}</span>
                    <div className="result-details">
                      <span className="result-name">{result.data?.originalFileName || 'Unknown'}</span>
                      {result.success && result.data && (
                        <span className="result-meta">
                          {result.data.pageCount} page{result.data.pageCount > 1 ? 's' : ''} converted and saved to library
                        </span>
                      )}
                      {!result.success && (
                        <span className="result-error">Error: {result.error}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

    </div>
  );
}

export default App;
