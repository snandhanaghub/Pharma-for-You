import React, { useMemo, useRef, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import * as api from '../services/api';
import './ChatAssistantPage.css';

const parseMedicinesFromText = (text) => {
  if (!text) return [];
  const normalized = text
    .replace(/\s+\+\s+/g, ',')
    .replace(/\s+and\s+/gi, ',')
    .replace(/[\n;|]/g, ',');
  const parts = normalized
    .split(',')
    .map((item) =>
      item
        .replace(/^(hey|hi|hello)\b[\s,]*/i, '')
        .replace(/^(i\s+(took|take|am\s+taking|use|used|have\s+taken|had))\b[\s,:-]*/i, '')
        .replace(/^(please\s+check|check|analyze|analyse)\b[\s,:-]*/i, '')
        .trim()
    )
    .filter((item) => item.length > 1);
  return [...new Set(parts)];
};

const highestSeverity = (rows) => {
  const order = { none: 0, moderate: 1, severe: 2, high: 3 };
  let result = 'None';
  let level = 0;
  (rows || []).forEach((row) => {
    const value = (row.severity || 'none').toLowerCase();
    const currentLevel = order[value] ?? 0;
    if (currentLevel >= level) {
      level = currentLevel;
      result = row.severity || 'None';
    }
  });
  return result;
};

const SEVERITY_STYLES = {
  high:     { bg: '#fff1f1', border: '#f87171', badge: '#dc2626', text: '#7f1d1d' },
  severe:   { bg: '#fff1f1', border: '#f87171', badge: '#dc2626', text: '#7f1d1d' },
  moderate: { bg: '#fffbeb', border: '#fbbf24', badge: '#d97706', text: '#78350f' },
  none:     { bg: '#f0fdf4', border: '#86efac', badge: '#16a34a', text: '#14532d' },
};

const getSeverityStyle = (severity) =>
  SEVERITY_STYLES[(severity || 'none').toLowerCase()] || SEVERITY_STYLES.none;

const StructuredResult = ({ data }) => {
  const style = getSeverityStyle(data.severity);
  return (
    <div
      className="result-card-bubble"
      style={{ borderColor: style.border, background: style.bg }}
    >
      <div className="rcb-header">
        <span className="rcb-title">💊 {data.medicines.join(' + ')}</span>
        <span className="rcb-badge" style={{ background: style.badge, color: '#fff' }}>
          {data.severity}
        </span>
      </div>

      {data.pairsEvaluated !== undefined && (
        <div className="rcb-meta">
          {data.pairsEvaluated} pair{data.pairsEvaluated !== 1 ? 's' : ''} evaluated
          &nbsp;·&nbsp;
          {data.pairsWithInteractions} with interaction
          {data.pairsWithInteractions !== 1 ? 's' : ''}
        </div>
      )}

      <div className="rcb-divider" />

      {data.summary && (
        <div className="rcb-section">
          <div className="rcb-label">📝 Summary</div>
          <div className="rcb-text">{data.summary}</div>
        </div>
      )}

      {data.explanation && (
        <div className="rcb-section">
          <div className="rcb-label">🔬 Clinical Explanation</div>
          <div className="rcb-text">{data.explanation}</div>
        </div>
      )}

      {data.recommendation && (
        <div className="rcb-section">
          <div className="rcb-label">✅ Recommendation</div>
          <div className="rcb-text" style={{ color: style.text }}>
            {data.recommendation}
          </div>
        </div>
      )}
    </div>
  );
};

const ChatAssistantPage = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'I can check medicine interactions. Type two or more medicine names (example: Warfarin + Garlic), or upload a prescription image.',
    },
  ]);
  const [input, setInput] = useState('');
  const [stagedFiles, setStagedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const messagesRef = useRef(null);

  const canSend = useMemo(
    () => (input.trim().length > 0 || stagedFiles.length > 0) && !loading,
    [input, stagedFiles, loading]
  );

  const appendMessage = (message) => {
    setMessages((prev) => [...prev, message]);
    setTimeout(() => {
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    }, 0);
  };

  const runInteractionCheck = async (medicines, sourceText) => {
    const response = await api.checkInteractions(medicines, sourceText || '');

    if (!response.success) {
      appendMessage({
        role: 'assistant',
        text: response.error || 'Failed to analyze interactions.',
      });
      return;
    }

    const effectiveMeds = response.effective_medicines || medicines;
    const pairwise = response.pairwise_interactions || [];
    const interactionPairs = pairwise.filter((item) => (item.rows_found || 0) > 0);

    // Build clean medicine names from DB matches only — never use raw OCR text
    let cleanMedNames = [];
    if (response.matched_medicines) {
      for (const [, candidates] of Object.entries(response.matched_medicines)) {
        for (const c of candidates) {
          const name = c.name || '';
          if (name && !cleanMedNames.includes(name)) cleanMedNames.push(name);
        }
      }
    }
    if (cleanMedNames.length === 0) cleanMedNames = effectiveMeds;

    const severity = highestSeverity(response.direct_interactions);

    appendMessage({
      role: 'assistant',
      structured: {
        medicines: cleanMedNames,
        severity,
        pairsEvaluated: pairwise.length,
        pairsWithInteractions: interactionPairs.length,
        summary: response.interaction_analysis || 'No summary available.',
        explanation: response.clinical_explanation || '',
        recommendation:
          response.safety_recommendations || 'Consult your clinician for final guidance.',
      },
    });
  };

  const handleSend = async () => {
    const text = input.trim();
    if ((!text && stagedFiles.length === 0) || loading) return;

    const newMessage = { role: 'user', text };
    const currentFiles = [...stagedFiles];

    if (currentFiles.length > 0) {
      newMessage.imageUrl = URL.createObjectURL(currentFiles[0]);
      const extra =
        currentFiles.length > 1 ? `\n[Attached ${currentFiles.length} files]` : '';
      newMessage.text = text ? text + extra : extra.trim();
    }

    appendMessage(newMessage);
    setInput('');
    setStagedFiles([]);
    setLoading(true);

    let extractedText = '';
    let extractedMedicines = [];

    if (currentFiles.length > 0) {
      try {
        const ocrResponse = await api.analyzeMedicineImage(currentFiles);
        if (ocrResponse.success && ocrResponse.extracted_text) {
          extractedText = ocrResponse.extracted_text;
          extractedMedicines = (ocrResponse.matching_medicines || []).map(
            (m) => m.brand_name || m.generic_name || m.name || ''
          );
        } else {
          appendMessage({
            role: 'assistant',
            text: ocrResponse.error || 'Could not read medicines from prescription.',
          });
          setLoading(false);
          return;
        }
      } catch {
        appendMessage({ role: 'assistant', text: 'Error processing prescription upload.' });
        setLoading(false);
        return;
      }
    }

    const typedMedicines = parseMedicinesFromText(text);
    const medicines = [...new Set([...typedMedicines, ...extractedMedicines])];
    const combinedContext = [extractedText, text].filter(Boolean).join(' ');

    if (medicines.length < 2) {
      appendMessage({
        role: 'assistant',
        text: `I detected fewer than two medicines. Please provide more context or upload a clearer prescription. Found: ${
          medicines.length > 0 ? medicines.join(', ') : 'None'
        }`,
      });
      setLoading(false);
      return;
    }

    try {
      await runInteractionCheck(medicines, combinedContext);
    } catch {
      appendMessage({ role: 'assistant', text: 'Error checking interactions. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    if (!loading) fileInputRef.current?.click();
  };

  const handleStageFile = (event) => {
    const newFiles = Array.from(event.target.files || []);
    if (!newFiles.length || loading) return;
    setStagedFiles((prev) => [...prev, ...newFiles]);
    event.target.value = '';
  };

  const removeStagedFile = (idxToRemove) => {
    setStagedFiles((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  return (
    <div className="chat-assistant-layout">
      <Sidebar />
      <main className="chat-assistant-main">
        <div className="chat-assistant-container">
          <h1 className="page-title">Interaction Assistant</h1>
          <Card className="chat-card">
            <div className="chat-messages" ref={messagesRef}>
              {messages.map((message, index) => (
                <div key={index} className={`chat-row ${message.role}`}>
                  {message.structured ? (
                    <div className="chat-row-full">
                      <StructuredResult data={message.structured} />
                    </div>
                  ) : (
                    <div className={`chat-bubble ${message.role}`}>
                      {message.imageUrl && (
                        <div className="chat-image-preview">
                          <img
                            src={message.imageUrl}
                            alt="Uploaded prescription"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '200px',
                              borderRadius: '8px',
                              marginBottom: '8px',
                              objectFit: 'contain',
                            }}
                          />
                        </div>
                      )}
                      {message.text}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="chat-row assistant">
                  <div className="chat-bubble assistant thinking-bubble">
                    <span className="thinking-dot" />
                    <span className="thinking-dot" />
                    <span className="thinking-dot" />
                  </div>
                </div>
              )}
            </div>

            <div className="chat-input-area">
              {stagedFiles.length > 0 && (
                <div className="staged-files-row">
                  {stagedFiles.map((f, idx) => (
                    <div key={idx} style={{ position: 'relative', flexShrink: 0 }}>
                      <img
                        src={URL.createObjectURL(f)}
                        alt="Staged"
                        style={{
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          border: '1px solid #ccc',
                        }}
                      />
                      <button
                        onClick={() => removeStagedFile(idx)}
                        style={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          background: 'red',
                          color: 'white',
                          borderRadius: '50%',
                          border: 'none',
                          width: '18px',
                          height: '18px',
                          fontSize: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <input
                className="chat-text-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type medicines (e.g., Warfarin + Garlic)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />

              <div className="chat-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUploadClick}
                  disabled={loading}
                >
                  Attach Image
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSend}
                  disabled={!canSend}
                >
                  Send
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleStageFile}
                className="hidden-file-input"
              />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ChatAssistantPage;