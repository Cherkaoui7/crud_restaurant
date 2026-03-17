import { apiClient } from './client';

export async function loginRequest(payload) {
  const { data } = await apiClient.post('/login', payload);
  return data;
}

export async function fetchCurrentUser() {
  const { data } = await apiClient.get('/me');
  return data.data;
}

export async function logoutRequest() {
  await apiClient.post('/logout');
}
