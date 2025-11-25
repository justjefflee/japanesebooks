import { useState, useEffect } from 'react';
import { translateText } from '../utils/pdfConverter';
import './Translation.css';

function Translation({ onNavigateToLibrary }) {
  const [inputText, setInputText] = useState('');
  const [sentences, setSentences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState(null);

  useEffect(() => {
    // Debounce translation
    const timer = setTimeout(() => {
      if (inputText.trim()) {
        processText(inputText);
      } else {
        setSentences([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputText]);

  const processText = async (text) => {
    setLoading(true);

    // Split by Japanese punctuation and line breaks
    const parts = text.split(/([、。\r\n])/);
    const tempSentences = [];
    let currentSentence = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part === '、' || part === '。') {
        currentSentence += part;
        if (part === '。' && currentSentence.trim()) {
          tempSentences.push(currentSentence.trim());
          currentSentence = '';
        }
      } else if (part === '\n' || part === '\r\n' || part === '\r') {
        // Treat line breaks as sentence boundaries
        if (currentSentence.trim()) {
          tempSentences.push(currentSentence.trim());
          currentSentence = '';
        }
      } else if (part.trim()) {
        currentSentence += part;
      }
    }

    // Add any remaining text
    if (currentSentence.trim()) {
      tempSentences.push(currentSentence.trim());
    }

    // Translate all sentences
    const translatedSentences = [];
    for (const sentence of tempSentences) {
      if (sentence) {
        const translation = await translateText(sentence);
        translatedSentences.push({
          japanese: sentence,
          english: translation
        });
      }
    }

    setSentences(translatedSentences);
    setLoading(false);
  };

  const speakText = (text, rate = 0.9, buttonElement) => {
    // Stop any ongoing speech
    if (currentUtterance) {
      window.speechSynthesis.cancel();
      document.querySelectorAll('.speaker-btn').forEach(btn => {
        btn.classList.remove('speaking');
      });
    }

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = rate;

    // Add speaking class
    if (buttonElement) {
      buttonElement.classList.add('speaking');
    }

    // Remove speaking class when done
    utterance.onend = () => {
      if (buttonElement) {
        buttonElement.classList.remove('speaking');
      }
      setCurrentUtterance(null);
    };

    utterance.onerror = () => {
      if (buttonElement) {
        buttonElement.classList.remove('speaking');
      }
      setCurrentUtterance(null);
    };

    setCurrentUtterance(utterance);
    window.speechSynthesis.speak(utterance);
  };

  const clearText = () => {
    setInputText('');
    setSentences([]);
  };

  return (
    <div className="translation-page">
      <div className="translation-content">
        <div className="translation-header">
          <h2>🌐 Japanese Text Translator</h2>
          <button className="back-btn" onClick={onNavigateToLibrary}>
            ← Back to Library
          </button>
        </div>

        <div className="translation-container">
          <div className="input-panel">
            <div className="panel-header">
              <h3>Japanese Text</h3>
              <button className="clear-btn" onClick={clearText}>Clear</button>
            </div>
            <textarea
              className="japanese-input"
              placeholder="Paste Japanese text here...&#10;&#10;Text will be automatically split by 、and 。for translation."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="input-info">
              {inputText.length} characters
              {sentences.length > 0 && ` • ${sentences.length} sentence${sentences.length > 1 ? 's' : ''}`}
            </div>
          </div>

          <div className="output-panel">
            <div className="panel-header">
              <h3>Translation</h3>
              {loading && <span className="loading-indicator">Translating...</span>}
            </div>
            <div className="translation-output">
              {sentences.length === 0 && !loading && (
                <div className="empty-state">
                  Enter Japanese text on the left to see translations here.
                </div>
              )}

              {sentences.map((sentence, index) => (
                <div key={index} className="text-line">
                  <div className="text-line-content">
                    <div className="japanese-text">{sentence.japanese}</div>
                    {sentence.english && sentence.english !== sentence.japanese && (
                      <div className="english-translation">{sentence.english}</div>
                    )}
                  </div>
                  <div className="text-line-actions">
                    <button
                      className="speaker-btn"
                      onClick={(e) => speakText(sentence.japanese, 0.9, e.currentTarget)}
                      title="Speak at normal speed"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                      </svg>
                    </button>
                    <button
                      className="speaker-btn slow"
                      onClick={(e) => speakText(sentence.japanese, 0.6, e.currentTarget)}
                      title="Speak slowly"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Translation;
