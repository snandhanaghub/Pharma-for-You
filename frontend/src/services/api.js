import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const health = async () => {
  try {
    const response = await apiClient.get('/api/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

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

export const checkInteractions = async (medicines, description = '') => {
  try {
    const response = await apiClient.post('/api/check-interactions', {
      medicines,
      description,
    });
    return response.data;
  } catch (error) {
    console.error('Interaction check failed:', error);
    throw error;
  }
};

export const analyzeMedicineImage = async (files) => {
  try {
    const formData = new FormData();
    if (Array.isArray(files)) {
      files.forEach((file) => formData.append('files', file));
    } else {
      formData.append('files', files);
    }

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

export const explainMedicineImage = async (files) => {
  try {
    const formData = new FormData();
    if (Array.isArray(files)) {
      files.forEach((file) => formData.append('files', file));
    } else {
      formData.append('files', files);
    }

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

export const searchMedicinesList = async (query, type = '') => {
  try {
    const response = await apiClient.get('/api/medicines/search', {
      params: { q: query, type },
    });
    return response.data;
  } catch (error) {
    console.error('Medicine list search failed:', error);
    throw error;
  }
};

export default apiClient;
