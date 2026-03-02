import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
      // Call the backend OCR API
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await axios.post('/api/ocr/extract', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Extract unique text from OCR results
      const extractedTexts = response.data.results
        .map(item => item.text.trim())
        .filter(text => text.length > 0);
      
      // Remove duplicates
      const uniqueTexts = [...new Set(extractedTexts)];
      
      setDetectedDrugs(uniqueTexts);
      
      if (uniqueTexts.length === 0) {
        setError('No text detected in the image. Please try another image with clear text.');
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setError(err.response?.data?.detail || 'Failed to extract text from image. Please try again.');
      setDetectedDrugs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDrug = (drugToRemove) => {
    setDetectedDrugs(detectedDrugs.filter(drug => drug !== drugToRemove));
  };

  const handleAnalyze = () => {
    navigate('/result', { 
      state: { 
        drugA: detectedDrugs[0],
        drugB: detectedDrugs[1],
        severity: 'Moderate',
        confidence: 88
      } 
    });
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
                    disabled={detectedDrugs.length < 2}
                  >
                    Analyze Interactions
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
