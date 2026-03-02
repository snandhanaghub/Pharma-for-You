import React from 'react';
import './ResultDisplay.css';

const ResultDisplay = ({ results }) => {
  if (!results || results.length === 0) {
    return null;
  }

  return (
    <div className="result-display">
      <div className="result-header">
        <h2>Search Results</h2>
        <p className="result-count">Found {results.length} matching medicine(s)</p>
      </div>

      <div className="results-grid">
        {results.map((medicine) => {
          const confidencePercent = Math.round(medicine.confidence * 100);
          return (
            <div key={medicine.id} className="medicine-card">
              <div className="card-header">
                <div className="medicine-icon">💊</div>
                <div 
                  className="confidence-badge"
                  style={{ '--confidence': confidencePercent }}
                >
                  <div className="confidence-percentage">{confidencePercent}%</div>
                  <div className="confidence-label">Match</div>
                </div>
              </div>

              <div className="card-content">
                <h3 className="medicine-name">{medicine.brand_name}</h3>
                
                <div className="medicine-detail">
                  <span className="detail-label">Generic Name:</span>
                  <span className="detail-value">{medicine.generic_name}</span>
                </div>

                <div className="medicine-detail">
                  <span className="detail-label">Strength:</span>
                  <span className="detail-value">{medicine.strength}</span>
                </div>

                <div className="medicine-detail">
                  <span className="detail-label">Manufacturer:</span>
                  <span className="detail-value">{medicine.manufacturer}</span>
                </div>

                <div className="medicine-detail">
                  <span className="detail-label">Category:</span>
                  <span className="category-badge">{medicine.category}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="result-disclaimer">
        <p><strong>Disclaimer:</strong> This information is for educational purposes only. 
        Please consult a healthcare professional before taking any medicine.</p>
      </div>
    </div>
  );
};

export default ResultDisplay;
