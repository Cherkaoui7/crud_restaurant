import { apiClient } from './client';

export async function getAllergens() {
  const { data } = await apiClient.get('/allergens');
  return data;
}
