import { useState, useEffect } from 'react';
import {
  getAllMetadata,
  updateMetadata,
  deleteMetadata,
  clearAllMetadata
} from '../utils/fileApi';
import './Library.css';

function Library({ onClose, onReconvert, onNavigateToConverter, onNavigateToTranslation }) {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [allTags, setAllTags] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [editTags, setEditTags] = useState('');
  const [sortBy, setSortBy] = useState('date'); // date, name, pages

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [history, searchQuery, selectedTag, sortBy]);

  const loadHistory = async () => {
    try {
      const data = await getAllMetadata();
      setHistory(data);

      // Extract all unique tags
      const tagsSet = new Set();
      data.forEach(item => {
        if (item.tags && Array.isArray(item.tags)) {
          item.tags.forEach(tag => tagsSet.add(tag));
        }
      });
      setAllTags(Array.from(tagsSet).sort());
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
      setAllTags([]);
    }
  };

  const applyFilters = () => {
    let filtered = [...history];

    // Apply search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.originalFileName?.toLowerCase().includes(lowerQuery) ||
        item.htmlFileName?.toLowerCase().includes(lowerQuery) ||
        item.notes?.toLowerCase().includes(lowerQuery) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
      );
    }

    // Apply tag filter
    if (selectedTag) {
      filtered = filtered.filter(item => item.tags && item.tags.includes(selectedTag));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.originalFileName || '').localeCompare(b.originalFileName || '');
        case 'pages':
          return (b.pageCount || 0) - (a.pageCount || 0);
        case 'date':
        default:
          return new Date(b.convertedAt || 0) - new Date(a.convertedAt || 0);
      }
    });

    setFilteredHistory(filtered);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this file? This will delete both the file and its metadata.')) {
      try {
        await deleteMetadata(id);
        loadHistory();
      } catch (error) {
        alert('Failed to delete file. Please try again.');
        console.error('Error deleting file:', error);
      }
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all files? This will delete all files and metadata. This cannot be undone.')) {
      try {
        await clearAllMetadata();
        loadHistory();
      } catch (error) {
        alert('Failed to clear all files. Please try again.');
        console.error('Error clearing files:', error);
      }
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditNotes(item.notes);
    setEditTags(item.tags.join(', '));
  };

  const saveEditing = async (id) => {
    try {
      const tags = editTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await updateMetadata(id, {
        notes: editNotes,
        tags: tags
      });

      setEditingId(null);
      loadHistory();
    } catch (error) {
      alert('Failed to save changes. Please try again.');
      console.error('Error saving metadata:', error);
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditNotes('');
    setEditTags('');
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const handleViewFile = (item) => {
    // Open story viewer in new tab
    window.open('http://localhost:3001/story-viewer.html', '_blank');
  };

  return (
    <div className="library-page">
      <div className="library-content">
        <div className="library-header">
          <h2>📚 Japanese Books</h2>
          <div className="header-buttons">
            <button className="translate-btn" onClick={onNavigateToTranslation}>
              🌐 Translate Text
            </button>
            <button className="convert-new-btn" onClick={onNavigateToConverter}>
              + Convert New PDF
            </button>
          </div>
        </div>

        <div className="library-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by filename, notes, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-controls">
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="tag-filter"
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="pages">Sort by Pages</option>
            </select>

            {history.length > 0 && (
              <button onClick={handleClearAll} className="clear-all-btn">
                Clear All
              </button>
            )}
          </div>
        </div>

        <div className="library-stats">
          <span>Total: {history.length} conversions</span>
          {searchQuery || selectedTag ? (
            <span>Showing: {filteredHistory.length}</span>
          ) : null}
        </div>

        <div className="library-list">
          {filteredHistory.length === 0 ? (
            <div className="empty-state">
              <p>📭 No conversions found</p>
              {searchQuery || selectedTag ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTag('');
                  }}
                  className="clear-filters-btn"
                >
                  Clear Filters
                </button>
              ) : (
                <p className="empty-hint">Convert some PDFs to see them here!</p>
              )}
            </div>
          ) : (
            filteredHistory.map(item => (
              <div key={item.id} className="library-item">
                <div className="library-item-header">
                  <div className="library-item-title">
                    <h3>{item.originalFileName}</h3>
                    <span className="library-item-meta">
                      {item.pageCount} page{item.pageCount !== 1 ? 's' : ''} • {formatDate(item.convertedAt)}
                      {item.fileSize && ` • ${formatFileSize(item.fileSize)}`}
                    </span>
                  </div>
                  <div className="library-item-actions">
                    <button
                      onClick={() => handleViewFile(item)}
                      className="action-btn view-btn"
                      title="View HTML file"
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => onReconvert(item)}
                      className="action-btn reconvert-btn"
                      title="Download HTML again"
                    >
                      ⬇️
                    </button>
                    <button
                      onClick={() => startEditing(item)}
                      className="action-btn edit-btn"
                      title="Edit notes and tags"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="action-btn delete-btn"
                      title="Remove from library"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {editingId === item.id ? (
                  <div className="library-item-edit">
                    <div className="edit-field">
                      <label>Tags (comma-separated):</label>
                      <input
                        type="text"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        placeholder="e.g., work, japanese, important"
                        className="edit-input"
                      />
                    </div>
                    <div className="edit-field">
                      <label>Notes:</label>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Add notes about this conversion..."
                        className="edit-textarea"
                        rows="3"
                      />
                    </div>
                    <div className="edit-actions">
                      <button onClick={() => saveEditing(item.id)} className="save-btn">
                        Save
                      </button>
                      <button onClick={cancelEditing} className="cancel-btn">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="library-item-details">
                    {item.tags.length > 0 && (
                      <div className="library-item-tags">
                        {item.tags.map(tag => (
                          <span
                            key={tag}
                            className="tag"
                            onClick={() => setSelectedTag(tag)}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.notes && (
                      <div className="library-item-notes">
                        <p>{item.notes}</p>
                      </div>
                    )}
                    {item.savedPath && (
                      <div className="library-item-path">
                        <small>📁 {item.savedPath}</small>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Library;
