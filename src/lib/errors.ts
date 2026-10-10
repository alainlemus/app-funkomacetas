/** Mensaje legible de un error de la API: primer error de validación, o el mensaje, o un texto por defecto. */
export function getErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data;
  const firstValidation = data?.errors ? (Object.values(data.errors)[0] as string[] | undefined)?.[0] : undefined;

  if (firstValidation) return firstValidation;
  if (typeof data?.message === 'string' && data.message) return data.message;
  if (error?.code === 'ECONNABORTED' || error?.message === 'Network Error') {
    return 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.';
  }
  return fallback;
}
