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
      // Create a prompt for TinyLlama to check drug interactions
      const prompt = `Check for drug interactions between ${drugA} and ${drugB}. 
Provide:
1. Interaction severity (None/Minor/Moderate/Severe)
2. Specific interactions
3. Recommendations
Keep response concise.`;

      const response = await api.askAI(prompt);

      if (response.success) {
        // Parse the AI response to determine severity
        const responseText = response.response.toUpperCase();
        let severity = 'Unknown';
        let confidence = 65;

        if (responseText.includes('SEVERE') || responseText.includes('CRITICAL')) {
          severity = 'Severe';
          confidence = 95;
        } else if (responseText.includes('MODERATE')) {
          severity = 'Moderate';
          confidence = 85;
        } else if (responseText.includes('MINOR')) {
          severity = 'Minor';
          confidence = 75;
        } else if (responseText.includes('NO INTERACTION') || responseText.includes('SAFE')) {
          severity = 'None';
          confidence = 90;
        }

        navigate('/result', { 
          state: { 
            drugA, 
            drugB,
            severity,
            confidence,
            aiExplanation: response.response
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
