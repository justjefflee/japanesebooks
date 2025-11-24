// Utility functions for managing conversion history in localStorage

const STORAGE_KEY = 'pdf-converter-history';

// Migration: Update existing entries to add savedToServer flag
export function migrateHistoryForServerFiles(serverFiles) {
  try {
    const history = getConversionHistory();
    let updated = false;

    history.forEach(item => {
      if (item.savedToServer === undefined && serverFiles.includes(item.htmlFileName)) {
        item.savedToServer = true;
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }

    return updated;
  } catch (error) {
    console.error('Error migrating history:', error);
    return false;
  }
}

export function getConversionHistory() {
  try {
    const history = localStorage.getItem(STORAGE_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error reading history:', error);
    return [];
  }
}

export function addConversionToHistory(conversion) {
  try {
    const history = getConversionHistory();
    const newEntry = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      originalFileName: conversion.originalFileName,
      htmlFileName: conversion.htmlFileName,
      pageCount: conversion.pageCount,
      fileSize: conversion.fileSize,
      convertedAt: new Date().toISOString(),
      tags: conversion.tags || [],
      notes: conversion.notes || '',
      savedPath: conversion.savedPath || null,
      savedToServer: conversion.savedToServer || false,
    };
    history.unshift(newEntry); // Add to beginning
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return newEntry;
  } catch (error) {
    console.error('Error adding to history:', error);
    return null;
  }
}

export function updateConversionInHistory(id, updates) {
  try {
    const history = getConversionHistory();
    const index = history.findIndex(item => item.id === id);
    if (index !== -1) {
      history[index] = { ...history[index], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating history:', error);
    return false;
  }
}

export function deleteConversionFromHistory(id) {
  try {
    const history = getConversionHistory();
    const filtered = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting from history:', error);
    return false;
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing history:', error);
    return false;
  }
}

export function searchHistory(query) {
  const history = getConversionHistory();
  const lowerQuery = query.toLowerCase();
  return history.filter(item =>
    item.originalFileName.toLowerCase().includes(lowerQuery) ||
    item.htmlFileName.toLowerCase().includes(lowerQuery) ||
    item.notes.toLowerCase().includes(lowerQuery) ||
    item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

export function filterHistoryByTag(tag) {
  const history = getConversionHistory();
  return history.filter(item => item.tags.includes(tag));
}

export function getAllTags() {
  const history = getConversionHistory();
  const tagsSet = new Set();
  history.forEach(item => {
    item.tags.forEach(tag => tagsSet.add(tag));
  });
  return Array.from(tagsSet).sort();
}
