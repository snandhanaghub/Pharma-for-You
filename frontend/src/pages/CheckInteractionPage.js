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
        const severityOrder = { none: 0, moderate: 1, severe: 2, high: 3 };
        let severity = 'None';
        let maxLevel = 0;

        interactionRows.forEach((row) => {
          const currentSeverity = (row.severity || 'None').toLowerCase();
          const level = severityOrder[currentSeverity] ?? 0;
          if (level >= maxLevel) {
            maxLevel = level;
            severity = row.severity || 'None';
          }
        });

        const confidence = response.supabase_rows_found > 0 ? 95 : 60;
        const interactionSummary = response.interaction_analysis || 'No summary available.';
        const clinicalExplanation = response.supabase_rows_found > 0
          ? (interactionRows.map((row) => row.description).filter(Boolean).join(' ') || interactionSummary)
          : 'No direct interaction rows were found in the database for this pair.';
        const recommendation = response.safety_recommendations || 'Consult your clinician for final guidance.';

        navigate('/result', { 
          state: { 
            drugA, 
            drugB,
            severity,
            confidence,
            interactionSummary,
            clinicalExplanation,
            recommendation,
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
