import { useState, useEffect } from 'react';
import { translateText, generateFurigana } from '../utils/pdfConverter';
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

    // Translate all sentences and generate furigana
    const translatedSentences = [];
    for (const sentence of tempSentences) {
      if (sentence) {
        const result = await translateText(sentence);
        const furigana = await generateFurigana(sentence);
        translatedSentences.push({
          japanese: sentence,
          furigana: furigana,
          romanization: result.romanization,
          chinese: result.translation
        });
      }
    }

    setSentences(translatedSentences);
    setLoading(false);
  };

  const speakText = (text, lang = 'ja-JP', rate = 0.9, buttonElement) => {
    // Stop any ongoing speech
    if (currentUtterance) {
      window.speechSynthesis.cancel();
      document.querySelectorAll('.speaker-btn').forEach(btn => {
        btn.classList.remove('speaking');
      });
    }

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
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
                    <div className="text-row">
                      <div className="japanese-text">{sentence.japanese}</div>
                      <div className="language-actions">
                        <button
                          className="speaker-btn"
                          onClick={(e) => speakText(sentence.japanese, 'ja-JP', 0.9, e.currentTarget)}
                          title="Speak Japanese at normal speed"
                        >
                          🇯🇵
                        </button>
                        <button
                          className="speaker-btn slow"
                          onClick={(e) => speakText(sentence.japanese, 'ja-JP', 0.6, e.currentTarget)}
                          title="Speak Japanese slowly"
                        >
                          🇯🇵 🐢
                        </button>
                      </div>
                    </div>
                    {sentence.romanization && (
                      <div className="romanization-text">{sentence.romanization}</div>
                    )}
                    {sentence.chinese && sentence.chinese !== sentence.japanese && (
                      <div className="text-row">
                        <div className="chinese-translation">{sentence.chinese}</div>
                        <div className="language-actions">
                          <button
                            className="speaker-btn chinese"
                            onClick={(e) => speakText(sentence.chinese, 'zh-TW', 0.9, e.currentTarget)}
                            title="Speak Chinese at normal speed"
                          >
                            🇹🇼
                          </button>
                          <button
                            className="speaker-btn slow chinese"
                            onClick={(e) => speakText(sentence.chinese, 'zh-TW', 0.6, e.currentTarget)}
                            title="Speak Chinese slowly"
                          >
                            🇹🇼 🐢
                          </button>
                        </div>
                      </div>
                    )}
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
