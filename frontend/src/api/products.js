import { apiClient } from './client';

export async function getProducts(params) {
  const { data } = await apiClient.get('/products', { params });
  return data;
}

export async function createProduct(payload) {
  const { data } = await apiClient.post('/products', payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data.data;
}

export async function updateProduct(productId, payload) {
  const { data } = await apiClient.post(`/products/${productId}?_method=PUT`, payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data.data;
}

export async function deleteProduct(productId) {
  await apiClient.delete(`/products/${productId}`);
}

export async function exportProductsCsv(params) {
  const response = await apiClient.get('/products/export/csv', {
    params,
    responseType: 'blob',
  });

  return response.data;
}

export async function importProductsCsv(file) {
  const payload = new FormData();
  payload.append('file', file);

  const { data } = await apiClient.post('/products/import/csv', payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data.data;
}
