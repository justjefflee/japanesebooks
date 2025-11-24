// API client for file server operations

const API_BASE_URL = 'http://localhost:3001/api';

export async function saveHtmlToServer(fileName, htmlContent, metadata = null) {
  try {
    const response = await fetch(`${API_BASE_URL}/save-html`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileName, htmlContent, metadata }),
    });

    if (!response.ok) {
      throw new Error('Failed to save file to server');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
}

// Get all metadata
export async function getAllMetadata() {
  try {
    const response = await fetch(`${API_BASE_URL}/metadata`);

    if (!response.ok) {
      throw new Error('Failed to get metadata');
    }

    const data = await response.json();
    return data.metadata || [];
  } catch (error) {
    console.error('Error getting metadata:', error);
    throw error;
  }
}

// Update metadata
export async function updateMetadata(id, updates) {
  try {
    const response = await fetch(`${API_BASE_URL}/metadata/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update metadata');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating metadata:', error);
    throw error;
  }
}

// Delete metadata and file
export async function deleteMetadata(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/metadata/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete metadata');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting metadata:', error);
    throw error;
  }
}

// Clear all metadata and files
export async function clearAllMetadata() {
  try {
    const response = await fetch(`${API_BASE_URL}/metadata`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to clear metadata');
    }

    return await response.json();
  } catch (error) {
    console.error('Error clearing metadata:', error);
    throw error;
  }
}

export async function getHtmlFromServer(fileName) {
  try {
    const response = await fetch(`${API_BASE_URL}/get-html/${encodeURIComponent(fileName)}`);

    if (!response.ok) {
      throw new Error('Failed to get file from server');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting file:', error);
    throw error;
  }
}

export async function listHtmlFiles() {
  try {
    const response = await fetch(`${API_BASE_URL}/list-files`);

    if (!response.ok) {
      throw new Error('Failed to list files');
    }

    return await response.json();
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
}

export async function deleteHtmlFromServer(fileName) {
  try {
    const response = await fetch(`${API_BASE_URL}/delete-html/${encodeURIComponent(fileName)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete file from server');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

export function getViewUrl(fileName) {
  return `${API_BASE_URL}/view/${encodeURIComponent(fileName)}`;
}

export async function checkServerHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Save book data to metadata.json
export async function saveBookData(bookData) {
  try {
    const response = await fetch(`${API_BASE_URL}/save-book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookData),
    });

    if (!response.ok) {
      throw new Error('Failed to save book data to server');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving book data:', error);
    throw error;
  }
}
