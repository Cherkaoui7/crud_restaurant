export function getErrorMessage(error, fallback = 'Une erreur est survenue.') {
  const message = error?.response?.data?.message;

  if (message) {
    return message;
  }

  const fieldErrors = error?.response?.data?.errors;

  if (fieldErrors && typeof fieldErrors === 'object') {
    const firstError = Object.values(fieldErrors).flat()[0];

    if (firstError) {
      return firstError;
    }
  }

  return fallback;
}

export function getValidationErrors(error) {
  return error?.response?.data?.errors ?? {};
}
