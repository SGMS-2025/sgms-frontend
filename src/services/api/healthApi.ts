import { api } from './api';

// Fetches health status from the backend
export const getHealthStatus = async () => {
  const response = await api.get('/health');
  return response.data;
};
