import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import InputField from '../components/ui/InputField';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import './CheckInteractionPage.css';

const CheckInteractionPage = () => {
  const [drugA, setDrugA] = useState('');
  const [drugB, setDrugB] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSwap = () => {
    const temp = drugA;
    setDrugA(drugB);
    setDrugB(temp);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const response = await api.checkInteractions(
        [drugA, drugB],
        `Check interaction between ${drugA} and ${drugB}`
      );

      if (response.success) {
        const interactionRows = response.direct_interactions || [];
        const severityOrder = { 
          'no significant interaction': 0, 'none': 0, 'mild': 0, 
          'significant interaction': 1, 'moderate': 1, 'severe': 1, 'high': 1 
        };
        let severity = 'No Significant Interaction';
        let maxLevel = 0;

        interactionRows.forEach((row) => {
          const currentSeverity = (row.severity || 'No Significant Interaction').toLowerCase();
          const level = severityOrder[currentSeverity] ?? 0;
          if (level >= maxLevel) {
            maxLevel = level;
            // if we hit level 1, force standard new label just in case the row had "moderate"
            severity = level === 1 ? 'Significant Interaction' : 'No Significant Interaction';
          }
        });

        const confidence = response.supabase_rows_found > 0 ? 95 : 60;
        const interactionSummary = response.interaction_analysis || 'No summary available.';
        const clinicalExplanation = response.supabase_rows_found > 0
          ? (interactionRows.map((row) => row.description).filter(Boolean).join(' ') || interactionSummary)
          : 'No direct interaction rows were found in the database for this pair.';
        const recommendation = response.safety_recommendations || 'Consult your clinician for final guidance.';
        const webResearchSummary = response.web_research_summary || 'No web literature summary available.';

        navigate('/result', { 
          state: { 
            drugA, 
            drugB,
            severity,
            confidence,
            interactionSummary,
            clinicalExplanation,
            recommendation,
            webResearchSummary,
            signals: response.signals || null,
            supabaseRowsFound: response.supabase_rows_found || 0
          } 
        });
      } else {
        setError(response.error || 'Failed to check interactions. Please try again.');
      }
    } catch (err) {
      console.error('Interaction check error:', err);
      setError('Error checking drug interactions. Make sure Ollama is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="check-interaction-layout">
      <Sidebar />
      
      <main className="check-interaction-main">
        <div className="check-interaction-container">
          <h1 className="page-title">Check Drug Interaction</h1>
          
          <Card className="check-form-card">
            {error && (
              <div className="error-message" style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleAnalyze} className="check-form">
              <InputField
                label="Drug A"
                value={drugA}
                onChange={(e) => setDrugA(e.target.value)}
                placeholder="Enter first drug name"
                required
              />
              
              <button 
                type="button" 
                className="swap-button"
                onClick={handleSwap}
              >
                ⇅
              </button>
              
              <InputField
                label="Drug B"
                value={drugB}
                onChange={(e) => setDrugB(e.target.value)}
                placeholder="Enter second drug name"
                required
              />
              
              <Button 
                type="submit" 
                variant="primary" 
                fullWidth={true}
                loading={loading}
              >
                Analyze
              </Button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CheckInteractionPage;
