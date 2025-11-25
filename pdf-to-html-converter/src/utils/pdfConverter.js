import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker using the local file from node_modules
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// Translation function using Google Translate
export async function translateText(text, sourceLang = 'ja', targetLang = 'en') {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
    }
    return text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

export async function convertTxtToHtml(file) {
  try {
    const text = await file.text();

    // Split text by line breaks
    const lines = text.split(/\r?\n/);

    // Filter out empty lines and translate each line
    const translatedLines = [];
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        const translation = await translateText(trimmedLine);
        translatedLines.push({
          japanese: trimmedLine,
          english: translation
        });
      }
    }

    // Create a single "page" with all text lines
    const pages = [{
      pageNumber: 1,
      imageData: null, // No image for text files
      textLines: translatedLines
    }];

    // Generate unique ID
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 15);

    return {
      success: true,
      data: {
        id: id,
        title: file.name.replace('.txt', ''),
        originalFileName: file.name,
        pageCount: 1,
        fileSize: file.size,
        convertedAt: new Date().toISOString(),
        tags: [],
        notes: '',
        savedToServer: false,
        pages: pages
      }
    };
  } catch (error) {
    console.error('Error converting TXT:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function convertPdfToHtml(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const pages = [];

    // Process each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);

      // Extract text content
      const textContent = await page.getTextContent();

      // Filter out furigana by detecting smaller font sizes
      // Furigana typically has a significantly smaller font size than main text
      const fontSizes = textContent.items.map(item => {
        // Font size is in the transform matrix: [scaleX, skewY, skewX, scaleY, translateX, translateY]
        // scaleY (index 3) represents the font height
        return Math.abs(item.transform[3]);
      });

      // Find the most common (median) font size - this is likely the main text
      const sortedSizes = [...fontSizes].sort((a, b) => a - b);
      const medianSize = sortedSizes[Math.floor(sortedSizes.length / 2)];

      // Filter out items with font size less than 60% of median (likely furigana)
      const mainTextItems = textContent.items.filter((item, index) => {
        const fontSize = fontSizes[index];
        return fontSize >= medianSize * 0.6;
      });

      // Group text items into lines based on their y-position
      const textLines = [];
      let currentLine = [];
      let lastY = null;

      mainTextItems.forEach(item => {
        const itemY = item.transform[5];

        // If y-position changed significantly, start a new line
        if (lastY !== null && Math.abs(itemY - lastY) > 2) {
          if (currentLine.length > 0) {
            textLines.push(currentLine.join('').trim());
            currentLine = [];
          }
        }

        if (item.str.trim()) {
          currentLine.push(item.str);
        }
        lastY = itemY;
      });

      // Add the last line
      if (currentLine.length > 0) {
        textLines.push(currentLine.join('').trim());
      }

      // Join lines that are broken mid-sentence
      const joinedLines = [];
      for (let i = 0; i < textLines.length; i++) {
        let line = textLines[i];

        // Keep joining with next line if:
        // 1. Current line doesn't end with sentence punctuation (。、！？), OR
        // 2. Next line starts with punctuation
        while (i + 1 < textLines.length) {
          const nextLine = textLines[i + 1];
          const endsWithPunctuation = /[。、！？]$/.test(line);
          const nextStartsWithPunctuation = /^[。、！？]/.test(nextLine);

          if (!endsWithPunctuation || nextStartsWithPunctuation) {
            line += nextLine;
            i++;
          } else {
            break;
          }
        }

        if (line) {
          joinedLines.push(line);
        }
      }

      // Split on 、and 。to create separate translation units
      const finalTextLines = [];
      joinedLines.forEach(line => {
        // Split on 、or 。and filter out empty strings
        const parts = line.split(/[、。]/);
        parts.forEach(part => {
          const trimmed = part.trim();
          if (trimmed) {
            finalTextLines.push(trimmed);
          }
        });
      });

      // Render page as canvas to get image
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      const imageData = canvas.toDataURL('image/png');

      // Translate all lines and create structured data
      const translatedLines = [];
      for (const line of finalTextLines) {
        if (line) {
          const translation = await translateText(line);
          translatedLines.push({
            japanese: line,
            english: translation
          });
        }
      }

      pages.push({
        pageNumber: pageNum,
        imageData: imageData,
        textLines: translatedLines
      });
    }

    // Generate unique ID
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 15);

    return {
      success: true,
      data: {
        id: id,
        title: file.name.replace('.pdf', ''),
        originalFileName: file.name,
        pageCount: pdf.numPages,
        fileSize: file.size,
        convertedAt: new Date().toISOString(),
        tags: [],
        notes: '',
        savedToServer: false,
        pages: pages
      }
    };
  } catch (error) {
    console.error('Error converting PDF:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
