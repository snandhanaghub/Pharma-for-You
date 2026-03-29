import React, { useState, useRef } from 'react';
import axios from 'axios';
import './ImageUpload.css';
import OCRResult from './OCRResult';

const ImageUpload = ({ onResults, onError, onLoading }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [ocrResults, setOcrResults] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onError('Please select a valid image file (JPG, JPEG, or PNG)');
      return;
    }

    setSelectedImage(file);
    setOcrResults(null);
    onResults(null);
    onError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleOCRExtract = async () => {
    if (!selectedImage) {
      onError('Please select an image first');
      return;
    }

    try {
      onLoading(true);
      onError(null);

      const formData = new FormData();
      formData.append('file', selectedImage);

      const response = await axios.post('/api/ocr/extract', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setOcrResults(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to extract text from image. Please try again.';
      onError(errorMessage);
    } finally {
      onLoading(false);
    }
  };

  const handleTextSelection = async (selectedText) => {
    try {
      onLoading(true);
      onError(null);

      const response = await axios.post('/api/search/selected', {
        selected_text: selectedText
      });

      onResults(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to find medicine. Please try another text.';
      onError(errorMessage);
    } finally {
      onLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setOcrResults(null);
    onResults(null);
    onError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="image-upload">
      <h2 className="section-title">Upload Medicine Strip Image</h2>
      <p className="section-description">
        Upload a clear image of your medicine strip. We'll detect the text and help you identify it.
      </p>

      {!imagePreview ? (
        <div className="upload-area">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleImageSelect}
            className="file-input"
            id="file-input"
          />
          <label htmlFor="file-input" className="upload-label">
            <div className="upload-icon">+</div>
            <p className="upload-text">Click to upload or drag and drop</p>
            <p className="upload-hint">JPG, JPEG or PNG (MAX. 10MB)</p>
          </label>
        </div>
      ) : (
        <div className="image-preview-section">
          <div className="image-container">
            {!ocrResults ? (
              <img src={imagePreview} alt="Medicine strip" className="preview-image" />
            ) : (
              <OCRResult
                imageUrl={imagePreview}
                ocrData={ocrResults}
                onTextSelect={handleTextSelection}
              />
            )}
          </div>

          <div className="action-buttons">
            {!ocrResults ? (
              <>
                <button onClick={handleOCRExtract} className="action-button primary">
                  Extract Text
                </button>
                <button onClick={handleReset} className="action-button secondary">
                  Change Image
                </button>
              </>
            ) : (
              <button onClick={handleReset} className="action-button secondary">
                Upload New Image
              </button>
            )}
          </div>
        </div>
      )}

      <div className="upload-tips">
        <h3 className="tips-title">Tips for best results:</h3>
        <ul className="tips-list">
          <li>Ensure good lighting</li>
          <li>Keep the image steady and focused</li>
          <li>Capture the medicine name clearly</li>
          <li>Avoid reflections and shadows</li>
        </ul>
      </div>
    </div>
  );
};

export default ImageUpload;
