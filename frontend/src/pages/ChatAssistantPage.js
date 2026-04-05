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
  'significant interaction': { bg: '#984C34', badgeBg: '#F3E8DE', badgeText: '#984C34' },
  'no significant interaction': { bg: '#818E6E', badgeBg: '#F3E8DE', badgeText: '#818E6E' },
  high:     { bg: '#984C34', badgeBg: '#F3E8DE', badgeText: '#984C34' },
  severe:   { bg: '#984C34', badgeBg: '#F3E8DE', badgeText: '#984C34' },
  moderate: { bg: '#984C34', badgeBg: '#F3E8DE', badgeText: '#984C34' },
  mild:     { bg: '#818E6E', badgeBg: '#F3E8DE', badgeText: '#818E6E' },
  none:     { bg: '#818E6E', badgeBg: '#F3E8DE', badgeText: '#818E6E' },
};

const getSeverityStyle = (severity) =>
  SEVERITY_STYLES[(severity || 'none').toLowerCase()] || SEVERITY_STYLES.none;

const StructuredResult = ({ data }) => {
  const style = getSeverityStyle(data.severity);
  const renderSourcesList = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];
    return urls.map((url, i) => (
      <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginBottom: '8px' }}>{url}</a>
    ));
  };

  return (
    <div
      className="result-card-bubble"
      style={{ backgroundColor: style.bg }}
    >
      <div className="rcb-content">
      <div className="rcb-header">
        <span className="rcb-title">{data.medicines.join(' + ')}</span>
        <span className="rcb-badge" style={{ background: style.badgeBg, color: style.badgeText }}>
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

      {data.medicineSummaries && Object.keys(data.medicineSummaries).length > 0 && (
        <div className="rcb-section">
          <div className="rcb-label">About the medicines</div>
          <div className="rcb-text">
            {Object.entries(data.medicineSummaries).map(([med, sum], idx) => (
               <React.Fragment key={idx}>
                  <strong>{med}:</strong> {sum.replace(/^Definition:\s*/i, '')}
               </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {data.webResearchSummary ? (
        <>
          <div className="rcb-section">
            <div className="rcb-label">Clinical Explanation</div>
            <div className="rcb-text">
              {data.webResearchSummary.split(/\*\*Sources:\*\*/i)[0].trim()}
            </div>
          </div>
          {data.webResearchSummary.match(/\*\*Sources:\*\*/i) && (
            <div className="rcb-section">
              <div className="rcb-label">Sources</div>
              <div className="rcb-text">
                {renderSourcesList(data.webResearchSummary.split(/\*\*Sources:\*\*/i)[1])}
              </div>
            </div>
          )}
        </>
      ) : (
        data.explanation && (
          <div className="rcb-section">
            <div className="rcb-label">Clinical Explanation</div>
            <div className="rcb-text">{data.explanation}</div>
          </div>
        )
      )}

      {data.recommendation && (
        <div className="rcb-section">
          <div className="rcb-label">Recommendation</div>
          <div className="rcb-text">
            {data.recommendation}
          </div>
        </div>
      )}

      </div>
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
        explanation: response.clinical_explanation || '',
        recommendation:
          response.safety_recommendations || 'Consult your clinician for final guidance.',
        webResearchSummary: response.web_research_summary || null,
        medicineSummaries: response.medicine_summaries || {},
      },
    });
  };

  const handleSend = async (overrideText = null, overrideFiles = null) => {
    const isOverrideTextEvent = overrideText && typeof overrideText === 'object' && overrideText.nativeEvent;
    const isOverrideFilesEvent = overrideFiles && typeof overrideFiles === 'object' && !Array.isArray(overrideFiles);

    const text = (!isOverrideTextEvent && typeof overrideText === 'string') ? overrideText : input.trim();
    const currentFiles = (!isOverrideFilesEvent && Array.isArray(overrideFiles)) ? overrideFiles : [...stagedFiles];

    if ((!text && currentFiles.length === 0) || loading) return;

    const newMessage = { role: 'user', text };

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
          extractedMedicines = ocrResponse.medicines || [];
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

    if (medicines.length < 1) {
      appendMessage({
        role: 'assistant',
        text: `I could not detect any medicines. Please provide more context or upload a clearer prescription.`,
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
    event.target.value = '';
    handleSend(input.trim(), newFiles);
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

              <div className="chat-input-wrapper">
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
                <div className="chat-input-actions">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={handleUploadClick}
                    disabled={loading}
                    title="Attach Image"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                  </button>
                  <button
                    type="button"
                    className={`icon-btn ${canSend ? 'send-ready' : ''}`}
                    onClick={handleSend}
                    disabled={!canSend}
                    title="Send"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                  </button>
                </div>
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