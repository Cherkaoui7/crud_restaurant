import { apiClient } from './client';

export async function getPublicMenu() {
  const response = await apiClient.get('/public/menu');
  return response.data;
}
