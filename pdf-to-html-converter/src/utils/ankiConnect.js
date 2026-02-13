// AnkiConnect API integration
// Requires AnkiConnect add-on to be installed and Anki running
// Using Vite proxy to avoid CORS issues in development

const ANKI_CONNECT_URL = '/anki';

/**
 * Send a request to AnkiConnect API
 */
async function invokeAnkiConnect(action, params = {}) {
  const response = await fetch(ANKI_CONNECT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: action,
      version: 6,
      params: params,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to connect to AnkiConnect. Make sure Anki is running with AnkiConnect add-on installed.');
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`AnkiConnect error: ${data.error}`);
  }

  return data.result;
}

/**
 * Check if AnkiConnect is available
 */
export async function checkAnkiConnect() {
  try {
    const version = await invokeAnkiConnect('version');
    return version >= 6;
  } catch (error) {
    return false;
  }
}

/**
 * Create a new deck in Anki
 */
export async function createDeck(deckName) {
  try {
    await invokeAnkiConnect('createDeck', {
      deck: deckName,
    });
    return true;
  } catch (error) {
    console.error('Error creating deck:', error);
    throw error;
  }
}

/**
 * Store media file in Anki
 */
async function storeMediaFile(filename, data) {
  try {
    await invokeAnkiConnect('storeMediaFile', {
      filename: filename,
      data: data,
    });
    return true;
  } catch (error) {
    console.error('Error storing media file:', error);
    return false;
  }
}

/**
 * Generate audio from text using Google TTS and convert to base64
 */
async function generateAudioBase64(text, lang = 'ja') {
  try {
    // Use proxy to avoid CORS issues
    const url = `/api/tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to generate audio');
    }

    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remove the data:audio/mpeg;base64, prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error generating audio:', error);
    return null;
  }
}

/**
 * Add a note to Anki with audio
 */
export async function addNote(deckName, front, back, tags = [], audioFiles = {}) {
  try {
    // Store audio files if provided
    if (audioFiles.japanese) {
      await storeMediaFile(audioFiles.japanese.filename, audioFiles.japanese.data);
      front = `[sound:${audioFiles.japanese.filename}]<br>${front}`;
    }

    if (audioFiles.chinese) {
      await storeMediaFile(audioFiles.chinese.filename, audioFiles.chinese.data);
      back = `[sound:${audioFiles.chinese.filename}]<br>${back}`;
    }

    const noteId = await invokeAnkiConnect('addNote', {
      note: {
        deckName: deckName,
        modelName: 'Basic',
        fields: {
          Front: front,
          Back: back,
        },
        tags: tags,
        options: {
          allowDuplicate: false,
          duplicateScope: 'deck',
        },
      },
    });
    return noteId;
  } catch (error) {
    // If it's a duplicate, don't throw error
    if (error.message.includes('duplicate')) {
      console.log('Duplicate card skipped:', front);
      return null;
    }
    throw error;
  }
}

/**
 * Export book data to Anki
 */
export async function exportBookToAnki(bookData) {
  // Check if AnkiConnect is available
  const isAvailable = await checkAnkiConnect();
  if (!isAvailable) {
    throw new Error('AnkiConnect is not available. Please make sure:\n1. Anki is running\n2. AnkiConnect add-on is installed\n3. Anki is not showing any dialog boxes');
  }

  // Create deck name from book title
  const deckName = `Japanese::${bookData.title || 'Untitled'}`;

  // Create the deck
  await createDeck(deckName);

  // Track statistics
  let addedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // Check if this is a single-page book
  const isSinglePage = bookData.pageCount === 1;

  // Process pages
  for (const page of bookData.pages) {
    if (!page.textLines || page.textLines.length === 0) continue;

    // If single page, create a card for each line
    if (isSinglePage) {
      for (const line of page.textLines) {
        try {
          // Front: Japanese text
          const front = line.japanese;

          // Back: Romanization + Chinese translation
          let back = '';

          // Add romanization if available
          if (line.romanization) {
            back += `<div style="color: #888; font-size: 0.9em; margin-bottom: 4px;">${line.romanization}</div>`;
          }

          // Add Chinese translation if available and different from Japanese
          if (line.chinese) {
            back += `<div style="font-size: 1.1em;">${line.japanese}</div>`;
            back += `<div style="color: #999; font-size: 0.6em;">${line.chinese}</div>`;
          }

          // If back is empty, skip
          if (!back) {
            skippedCount++;
            continue;
          }

          // Add context information
          back += `<div style="margin-top: 16px; padding-top: 8px; border-top: 1px solid #eee; font-size: 0.8em; color: #999;">`;
          back += `From: ${bookData.title}`;
          if (page.title) {
            back += ` - ${page.title}`;
          }
          back += `</div>`;

          // Create tags
          const tags = [
            'japanese',
            bookData.title.replace(/\s+/g, '_'),
          ];

          // If page has a title, add it as a tag
          if (page.title) {
            tags.push(page.title.replace(/\s+/g, '_'));
          }

          // Audio generation disabled - use AwesomeTTS add-on in Anki for audio
          const audioFiles = {};

          // Add note to Anki
          const noteId = await addNote(deckName, front, back, tags, audioFiles);

          if (noteId) {
            addedCount++;
          } else {
            skippedCount++;
          }
        } catch (error) {
          console.error('Error adding note:', error);
          errorCount++;
        }
      }
    } else {
      // Multi-page book: create one card per page (original behavior)
      try {
        // Front: All Japanese text from the page (line by line)
        let front = '';
        page.textLines.forEach((line, index) => {
          if (index > 0) front += '<br>';
          front += line.japanese;
        });

        // Back: Romanization + Chinese translation (line by line)
        let back = '';
        page.textLines.forEach((line, index) => {
          if (index > 0) back += ''; //'<br><br>';

          // Add romanization if available
          if (line.romanization) {
            back += `<div style="color: #888; font-size: 0.9em; margin-bottom: 4px;">${line.romanization}</div>`;
          }

          // Add Chinese translation if available and different from Japanese
          if (line.chinese) {
            back += `<div style="font-size: 1.1em;">${line.japanese}</div>`;
            back += `<div style="color: #999; font-size: 0.6em;">${line.chinese}</div>`;
          }
        });

        // If back is empty, skip
        if (!back) {
          skippedCount++;
          continue;
        }

        // Add context information
        back += `<div style="margin-top: 16px; padding-top: 8px; border-top: 1px solid #eee; font-size: 0.8em; color: #999;">`;
        back += `From: ${bookData.title}`;
        if (page.title) {
          back += ` - ${page.title}`;
        } else if (bookData.pageCount > 1) {
          back += ` - Page ${page.pageNumber}`;
        }
        back += `</div>`;

        // Create tags
        const tags = [
          'japanese',
          bookData.title.replace(/\s+/g, '_'),
        ];

        // If page has a title, add it as a tag
        if (page.title) {
          tags.push(page.title.replace(/\s+/g, '_'));
        }

        // Audio generation disabled - use AwesomeTTS add-on in Anki for audio
        const audioFiles = {};

        // Add note to Anki
        const noteId = await addNote(deckName, front, back, tags, audioFiles);

        if (noteId) {
          addedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error('Error adding note:', error);
        errorCount++;
      }
    }
  }

  return {
    deckName,
    addedCount,
    skippedCount,
    errorCount,
    total: addedCount + skippedCount + errorCount,
  };
}
