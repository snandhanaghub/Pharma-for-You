import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import './SubmitInteractionPage.css';

const SEVERITY_OPTIONS = ['None', 'Mild', 'Moderate', 'Severe', 'High'];
const MED_TYPES = ['allopathy', 'ayurveda'];

const MedicineSearchInput = ({ label, selectedMed, onSelect, medType, onTypeChange }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  const search = useCallback(async (q) => {
    if (q.length < 2) { setResults([]); setSearched(false); return; }
    try {
      const resp = await api.searchMedicinesList(q, medType);
      setResults(resp.results || []);
      setSearched(true);
    } catch { setResults([]); setSearched(true); }
  }, [medType]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleUseCustom = () => {
    onSelect({ id: null, name: query.trim(), type: medType, custom: true });
    setShowDropdown(false);
  };

  const showCustomOption = searched && query.trim().length >= 2 && results.length === 0;
  const showDropdownMenu = showDropdown && !selectedMed && query.trim().length >= 2 &&
    (results.length > 0 || showCustomOption);

  return (
    <div className="form-group" ref={containerRef}>
      <label className="form-label">{label}</label>
      <div className="med-type-toggle">
        {MED_TYPES.map(t => (
          <button
            key={t}
            type="button"
            className={`type-btn ${medType === t ? 'type-btn-active' : ''}`}
            onClick={() => { onTypeChange(t); setResults([]); setSearched(false); }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {selectedMed ? (
        <div className={`selected-med ${selectedMed.custom ? 'selected-med-custom' : ''}`}>
          <span className="selected-med-name">{selectedMed.name}</span>
          <span className="selected-med-type">
            {selectedMed.custom ? '✏️ custom' : selectedMed.type}
          </span>
          <button
            className="clear-btn"
            type="button"
            onClick={() => { onSelect(null); setQuery(''); setResults([]); setSearched(false); }}
          >
            ✕
          </button>
        </div>
      ) : (
        <input
          className="form-input"
          type="text"
          placeholder={`Search or type a new ${medType} medicine...`}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
        />
      )}

      {showDropdownMenu && (
        <div className="search-dropdown">
          {results.map((r) => (
            <div
              key={`${r.type}-${r.id}`}
              className="search-dropdown-item"
              onClick={() => { onSelect(r); setShowDropdown(false); setQuery(r.name); }}
            >
              <span className="dropdown-name">{r.name}</span>
              <span className="dropdown-type">{r.type}</span>
            </div>
          ))}

          {showCustomOption && (
            <div className="search-dropdown-item search-dropdown-custom" onClick={handleUseCustom}>
              <span className="dropdown-custom-label">
                <span className="dropdown-custom-icon">✏️</span>
                Use &quot;<strong>{query.trim()}</strong>&quot; as a new entry
              </span>
              <span className="dropdown-type">not in DB</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SubmitInteractionPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [med1, setMed1] = useState(null);
  const [med1Type, setMed1Type] = useState('allopathy');
  const [med2, setMed2] = useState(null);
  const [med2Type, setMed2Type] = useState('ayurveda');
  const [severity, setSeverity] = useState('Moderate');
  const [activeIngredient, setActiveIngredient] = useState('');
  const [description, setDescription] = useState('');
  const [sourceLink, setSourceLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const missingFields = [];
  if (!med1) missingFields.push('Medicine 1');
  if (!med2) missingFields.push('Medicine 2');
  if (description.trim().length < 6) missingFields.push('Description (min 6 chars)');
  const canSubmit = missingFields.length === 0 && !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const payload = {
        med1_type: med1.type,
        med1_id: med1.id ?? null,
        med1_name: med1.custom ? med1.name : null,
        med2_type: med2.type,
        med2_id: med2.id ?? null,
        med2_name: med2.custom ? med2.name : null,
        active_ingredient: activeIngredient || null,
        severity,
        description,
        source_link: sourceLink || null,
        created_by: user?.id || null,
      };

      const resp = await api.submitInteraction(payload);

      if (resp.success) {
        setFeedback({ type: 'success', text: 'Interaction submitted! It will appear once an admin approves it.' });
        setMed1(null); setMed2(null);
        setDescription(''); setActiveIngredient(''); setSourceLink('');
      } else {
        setFeedback({ type: 'error', text: resp.error || 'Submission failed.' });
      }
    } catch (err) {
      const errMsg = err?.response?.data?.error || err?.response?.data?.detail || '';
      if (
        err?.response?.status === 409 ||
        errMsg.includes('unique_interaction_pair') ||
        errMsg.includes('duplicate') ||
        errMsg.includes('409')
      ) {
        setFeedback({ type: 'error', text: 'This interaction pair already exists in the database.' });
      } else {
        setFeedback({ type: 'error', text: 'Network error. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="submit-layout">
      <Sidebar />
      <main className="submit-main">
        <div className="submit-container">
          <h1 className="page-title">Submit New Interaction</h1>

          <Card className="submit-card">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <MedicineSearchInput
                  label="Medicine 1"
                  selectedMed={med1}
                  onSelect={setMed1}
                  medType={med1Type}
                  onTypeChange={setMed1Type}
                />
                <MedicineSearchInput
                  label="Medicine 2"
                  selectedMed={med2}
                  onSelect={setMed2}
                  medType={med2Type}
                  onTypeChange={setMed2Type}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Severity</label>
                  <select
                    className="form-input form-select"
                    value={severity}
                    onChange={e => setSeverity(e.target.value)}
                  >
                    {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Active Ingredient (Optional)</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. Allicin"
                    value={activeIngredient}
                    onChange={e => setActiveIngredient(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  className="form-input form-textarea"
                  placeholder="Describe the interaction mechanism, clinical significance, and potential risks..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Source / Reference Link (Optional)</label>
                <input
                  className="form-input"
                  type="url"
                  placeholder="https://pubmed.ncbi.nlm.nih.gov/..."
                  value={sourceLink}
                  onChange={e => setSourceLink(e.target.value)}
                />
              </div>

              {feedback && (
                <div className={`form-feedback ${feedback.type}`}>
                  {feedback.text}
                </div>
              )}

              <div className="form-actions">
                <Button type="submit" variant="primary" disabled={!canSubmit}>
                  {submitting ? 'Submitting...' : 'Submit Interaction'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                  Cancel
                </Button>
              </div>

              {!canSubmit && missingFields.length > 0 && !submitting && (
                <p style={{ color: '#888', fontSize: '0.82rem', marginTop: '0.5rem' }}>
                  ⚠️ Please fill: {missingFields.join(', ')}
                </p>
              )}
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SubmitInteractionPage;
