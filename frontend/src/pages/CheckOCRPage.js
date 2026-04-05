import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import DragDropUpload from '../components/ui/DragDropUpload';
import Card from '../components/ui/Card';
import Chip from '../components/ui/Chip';
import Button from '../components/ui/Button';
import './CheckOCRPage.css';

const CheckOCRPage = () => {
  const [file, setFile] = useState(null);
  const [detectedDrugs, setDetectedDrugs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleFileSelect = async (selectedFile) => {
    setFile(selectedFile);
    setLoading(true);
    setError(null);
    setDetectedDrugs([]);
    
    try {
      const response = await api.analyzeMedicineImage(selectedFile);

      if (response.success) {
        // Prefer the parsed medicines list; fall back to splitting extracted_text
        let drugs = [];
        if (Array.isArray(response.medicines) && response.medicines.length > 0) {
          drugs = response.medicines;
        } else if (response.extracted_text) {
          drugs = [...new Set(
            response.extracted_text
              .split(/[\n,;]/)
              .map(t => t.trim())
              .filter(t => t.length > 2)
          )];
        }

        setDetectedDrugs(drugs);

        if (drugs.length === 0) {
          setError('No medicines detected in the image. Please try a clearer photo.');
        }
      } else {
        setError(response.error || 'Failed to extract text from image.');
        setDetectedDrugs([]);
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setError(err.message || 'Failed to extract text from image. Please try again.');
      setDetectedDrugs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDrug = (drugToRemove) => {
    setDetectedDrugs(detectedDrugs.filter(drug => drug !== drugToRemove));
  };

  const handleAnalyze = async () => {
    if (detectedDrugs.length < 1) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.checkInteractions(detectedDrugs);
      
      if (response.success) {
        // Find highest severity from interactions
        const severityOrder = { none: 0, moderate: 1, severe: 2, high: 3 };
        let severity = 'None';
        let maxLevel = 0;
        
        const interactionRows = response.direct_interactions || [];
        interactionRows.forEach((row) => {
          const currentSeverity = (row.severity || 'None').toLowerCase();
          const level = severityOrder[currentSeverity] ?? 0;
          if (level >= maxLevel) {
            maxLevel = level;
            severity = row.severity || 'None';
          }
        });

        const interactionSummary = response.interaction_analysis || 'No summary available.';
        const clinicalExplanation = response.clinical_explanation || 'No clinical explanation available.';
        const recommendation = response.safety_recommendations || 'Consult your clinician for final guidance.';
        const webResearchSummary = response.web_research_summary || '';
        
        navigate('/result', { 
          state: { 
            drugA: detectedDrugs[0],
            drugB: detectedDrugs[1] || null,
            medicines: detectedDrugs,
            severity,
            confidence: response.confidence || 85,
            interactionSummary,
            clinicalExplanation,
            recommendation,
            webResearchSummary,
          } 
        });
      } else {
        setError(response.error || 'Failed to check interactions.');
      }
    } catch (err) {
      console.error('OCR Analysis Error:', err);
      setError('Error checking interactions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="check-ocr-layout">
      <Sidebar />
      
      <main className="check-ocr-main">
        <h1 className="page-title">Upload Prescription</h1>
        
        <div className="check-ocr-grid">
          <div className="upload-section">
            <DragDropUpload onFileSelect={handleFileSelect} />
            {file && (
              <p className="file-name text-muted">
                Selected: {file.name}
              </p>
            )}
          </div>
          
          <div className="preview-section">
            <Card>
              <h3 className="preview-title">Detected Drugs</h3>
              
              {error && (
                <div className="error-message" style={{ 
                  padding: '12px', 
                  marginBottom: '16px', 
                  backgroundColor: '#fee', 
                  border: '1px solid #fcc',
                  borderRadius: '4px',
                  color: '#c33'
                }}>
                  {error}
                </div>
              )}
              
              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p className="text-muted">Processing prescription...</p>
                </div>
              ) : detectedDrugs.length > 0 ? (
                <>
                  <div className="drugs-list">
                    {detectedDrugs.map((drug, index) => (
                      <Chip 
                        key={index} 
                        onRemove={() => handleRemoveDrug(drug)}
                      >
                        {drug}
                      </Chip>
                    ))}
                  </div>
                  
                  <Button 
                    variant="primary" 
                    fullWidth={true}
                    onClick={handleAnalyze}
                    disabled={detectedDrugs.length < 1}
                  >
                    {detectedDrugs.length === 1 ? 'Analyze Drug Safety' : 'Analyze Interactions'}
                  </Button>
                </>
              ) : (
                <p className="empty-state text-muted">
                  Upload a prescription to detect drugs
                </p>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CheckOCRPage;
