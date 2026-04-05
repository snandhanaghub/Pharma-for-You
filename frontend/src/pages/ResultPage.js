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
    webResearchSummary,
    signals,
  } = location.state;

  const severityColor = severity.toLowerCase().replace(/\s+/g, '-');

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
            {signals && (
              <section className="result-section signal-breakdown-section" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 className="result-section-title" style={{ color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '1.1rem', fontWeight: '700' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                  Hybrid Logic: Clinical Signal Analysis
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                  {/* Outcome Score */}
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Outcome Risk</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e293b' }}>{signals.breakdown.outcome.score}/5</div>
                    <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '4px', textTransform: 'capitalize' }}>{signals.breakdown.outcome.label}</div>
                    <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '8px' }}>
                      <div style={{ height: '100%', background: '#3b82f6', borderRadius: '2px', width: `${(signals.breakdown.outcome.score/5)*100}%` }}></div>
                    </div>
                  </div>

                  {/* Evidence Score */}
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Evidence Strength</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e293b' }}>{signals.breakdown.evidence.score}/3</div>
                    <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '4px', textTransform: 'capitalize' }}>{signals.breakdown.evidence.label}</div>
                    <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '8px' }}>
                      <div style={{ height: '100%', background: '#10b981', borderRadius: '2px', width: `${(signals.breakdown.evidence.score/3)*100}%` }}></div>
                    </div>
                  </div>

                  {/* Mechanism Score */}
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Mechanism Type</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e293b' }}>{signals.breakdown.mechanism.score}/3</div>
                    <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '4px', textTransform: 'capitalize' }}>{signals.breakdown.mechanism.label}</div>
                    <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '8px' }}>
                      <div style={{ height: '100%', background: '#f59e0b', borderRadius: '2px', width: `${(signals.breakdown.mechanism.score/3)*100}%` }}></div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '16px', padding: '10px', background: '#eff6ff', borderRadius: '6px', borderLeft: '4px solid #3b82f6', color: '#1e40af', fontSize: '0.9rem' }}>
                  <strong>Composite Score: {signals.score}/11</strong> — The algorithm classified this as <strong>{severity}</strong> based on clinical signals extracted from literature.
                </div>
              </section>
            )}

            {webResearchSummary && (
              <section className="result-section" style={{ backgroundColor: '#f8fafe', padding: '15px', borderRadius: '8px', border: '1px solid #e0e7ff', marginBottom: '20px' }}>
                <h3 className="result-section-title" style={{ color: '#2563eb', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                  Summary of Scraped Literature
                </h3>
                <p className="result-text" style={{ fontStyle: 'italic', margin: 0, color: '#1e293b', lineHeight: '1.6', fontSize: '1.05rem' }}>
                  {webResearchSummary}
                </p>
              </section>
            )}

            <section className="result-section">
              <h3 className="result-section-title">Database Records</h3>
              <p className="result-text">
                <strong>Interaction:</strong> {interactionSummary} <br/>
                <strong>Explanation:</strong> {clinicalExplanation}
              </p>
            </section>
            
            <section className="result-section">
              <h3 className="result-section-title">Safety Recommendation</h3>
              <p className="result-text" style={{ fontWeight: '600', color: '#dc2626' }}>
                {recommendation}
              </p>
            </section>

            <section className="result-section confidence-section">
              <h3 className="result-section-title">AI Confidence</h3>
              <div className="confidence-wrapper">
                <ConfidenceRing confidence={confidence} size={100} />
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
