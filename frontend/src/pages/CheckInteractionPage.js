import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import InputField from '../components/ui/InputField';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import './CheckInteractionPage.css';

const CheckInteractionPage = () => {
  const [drugA, setDrugA] = useState('');
  const [drugB, setDrugB] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSwap = () => {
    const temp = drugA;
    setDrugA(drugB);
    setDrugB(temp);
  };

  const handleAnalyze = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      navigate('/result', { 
        state: { 
          drugA, 
          drugB,
          severity: 'Moderate',
          confidence: 92
        } 
      });
    }, 1500);
  };

  return (
    <div className="check-interaction-layout">
      <Sidebar />
      
      <main className="check-interaction-main">
        <div className="check-interaction-container">
          <h1 className="page-title">Check Drug Interaction</h1>
          
          <Card className="check-form-card">
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
