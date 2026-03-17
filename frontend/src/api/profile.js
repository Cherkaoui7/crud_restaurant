import { apiClient } from './client';

export async function updateProfile(payload) {
  const { data } = await apiClient.put('/profile', payload);
  return data.data;
}

export async function updatePassword(payload) {
  const { data } = await apiClient.put('/profile/password', payload);
  return data;
}
