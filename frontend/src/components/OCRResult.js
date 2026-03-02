import React, { useState } from 'react';
import './OCRResult.css';

const OCRResult = ({ imageUrl, ocrData, onTextSelect }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleBoxClick = (index, text) => {
    setSelectedIndex(index);
    onTextSelect(text);
  };

  return (
    <div className="ocr-result">
      <div className="ocr-header">
        <h3>📝 Detected Text - Click on medicine name</h3>
        <p className="ocr-hint">Click on any text box to search for that medicine</p>
      </div>

      <div className="ocr-image-container">
        <img src={imageUrl} alt="Medicine strip with OCR overlay" className="ocr-image" />
        
        <svg className="ocr-overlay" viewBox={`0 0 ${ocrData.image_width} ${ocrData.image_height}`}>
          {ocrData.results.map((result, index) => {
            const bbox = result.bbox;
            const points = bbox.map(point => point.join(',')).join(' ');
            const isSelected = selectedIndex === index;

            return (
              <g key={index}>
                <polygon
                  points={points}
                  className={`ocr-box ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleBoxClick(index, result.text)}
                />
                <text
                  x={(bbox[0][0] + bbox[2][0]) / 2}
                  y={bbox[0][1] - 10}
                  className="ocr-text-label"
                  textAnchor="middle"
                >
                  {result.text}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="detected-text-list">
        <h4>Detected Text Items:</h4>
        <div className="text-chips">
          {ocrData.results.map((result, index) => (
            <button
              key={index}
              className={`text-chip ${selectedIndex === index ? 'selected' : ''}`}
              onClick={() => handleBoxClick(index, result.text)}
            >
              <span className="chip-text">{result.text}</span>
              <span className="chip-confidence">{Math.round(result.confidence * 100)}%</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OCRResult;
