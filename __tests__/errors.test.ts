import { getErrorMessage } from '../src/lib/errors';

test('prefiere el primer error de validación', () => {
  expect(getErrorMessage({ response: { data: { message: 'x', errors: { sku: ['SKU repetido'], name: ['otro'] } } } }, 'fb')).toBe('SKU repetido');
});
test('usa el mensaje del servidor', () => {
  expect(getErrorMessage({ response: { data: { message: 'No autorizado.' } } }, 'fb')).toBe('No autorizado.');
});
test('sin red da un mensaje claro', () => {
  expect(getErrorMessage({ message: 'Network Error' }, 'fb')).toContain('No hay conexión');
  expect(getErrorMessage({ code: 'ECONNABORTED' }, 'fb')).toContain('No hay conexión');
});
test('cae al texto por defecto', () => {
  expect(getErrorMessage({}, 'No se pudo guardar')).toBe('No se pudo guardar');
  expect(getErrorMessage(undefined, 'fb')).toBe('fb');
});
