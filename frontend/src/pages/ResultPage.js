import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Card from '../components/ui/Card';
import SeverityBadge from '../components/ui/SeverityBadge';
import ConfidenceRing from '../components/ui/ConfidenceRing';
import Button from '../components/ui/Button';
import './ResultPage.css';

const ResultPage = () => {
  const location = useLocation();
  if (!location.state) {
    return <Navigate to="/check-interaction" replace />;
  }

  const {
    drugA,
    drugB,
    severity,
    confidence,
    interactionSummary,
    clinicalExplanation,
    recommendation,
  } = location.state;

  const severityColor = severity.toLowerCase();

  return (
    <div className="result-layout">
      <Sidebar />
      
      <main className="result-main">
        <div className="result-container">
          <div className="result-header">
            <h1 className="result-title">{drugA} + {drugB}</h1>
            <SeverityBadge severity={severity} />
          </div>
          
          <Card 
            borderLeft={true} 
            borderColor={severityColor}
            className="result-card"
          >
            <section className="result-section">
              <h3 className="result-section-title">Interaction Summary</h3>
              <p className="result-text">
                {interactionSummary}
              </p>
            </section>
            
            <section className="result-section">
              <h3 className="result-section-title">Clinical Explanation</h3>
              <p className="result-text">
                {clinicalExplanation}
              </p>
            </section>
            
            <section className="result-section">
              <h3 className="result-section-title">Recommendation</h3>
              <p className="result-text">
                {recommendation}
              </p>
            </section>
            
            <section className="result-section confidence-section">
              <h3 className="result-section-title">AI Confidence</h3>
              <div className="confidence-wrapper">
                <ConfidenceRing confidence={confidence} size={120} />
              </div>
            </section>
          </Card>
          
          <div className="result-actions">
            <Button variant="outline">Save to History</Button>
            <Link to="/check-interaction">
              <Button variant="primary">New Check</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResultPage;
