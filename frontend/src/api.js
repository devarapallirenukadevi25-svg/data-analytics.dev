import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post(`${API_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const analyzeData = async (filename) => {
  const response = await axios.get(`${API_URL}/analyze/${filename}`);
  return response.data;
};

export const cleanData = async (filename) => {
  const response = await axios.post(`${API_URL}/clean/${filename}`);
  return response.data;
};

export const predictData = async (filename, targetCol, timeCol = null) => {
  const response = await axios.post(`${API_URL}/predict`, {
    filename,
    target_col: targetCol,
    time_col: timeCol
  });
  return response.data;
};
