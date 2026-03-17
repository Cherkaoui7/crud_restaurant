import { apiClient } from './client';

export async function getInventoryAlerts() {
  const { data } = await apiClient.get('/inventory/alerts');
  return data.data;
}
