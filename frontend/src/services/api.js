// API service for connecting to FastAPI backend
import axios from 'axios';

// Configure API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Health check
export const health = async () => {
  try {
    const response = await apiClient.get('/api/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

// OCR - Extract text from image
export const extractTextFromImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/api/ocr', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('OCR extraction failed:', error);
    throw error;
  }
};

// Search - Manual medicine search
export const searchMedicines = async (query) => {
  try {
    const response = await apiClient.post('/api/search/manual', {
      query: query,
    });
    return response.data;
  } catch (error) {
    console.error('Medicine search failed:', error);
    throw error;
  }
};

// AI - Ask TinyLlama a question
export const askAI = async (prompt) => {
  try {
    const response = await apiClient.post('/api/ask-ai', null, {
      params: {
        prompt: prompt,
      },
    });
    return response.data;
  } catch (error) {
    console.error('AI query failed:', error);
    throw error;
  }
};

// Analyze medicine - OCR + Search combo
export const analyzeMedicineImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/api/analyze-medicine', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Medicine analysis failed:', error);
    throw error;
  }
};

// Explain medicine - OCR + AI combo
export const explainMedicineImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/api/explain-medicine', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Medicine explanation failed:', error);
    throw error;
  }
};

// Search by text
export const searchByText = async (text) => {
  try {
    const response = await apiClient.post('/api/search/selected', {
      selected_text: text,
    });
    return response.data;
  } catch (error) {
    console.error('Text search failed:', error);
    throw error;
  }
};

export default apiClient;
