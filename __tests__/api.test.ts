const mockHttp = { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn(), delete: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } } };
jest.mock('axios', () => ({ __esModule: true, default: { create: jest.fn(() => mockHttp) } }));

import * as SecureStore from 'expo-secure-store';

// Se carga después de definir mockHttp (los import se elevan por encima del const).
const { api } = require('../src/services/api') as typeof import('../src/services/api');

const interceptors = { request: mockHttp.interceptors.request.use.mock.calls[0][0], response: mockHttp.interceptors.response.use.mock.calls[0][1] };

beforeEach(() => {
  jest.clearAllMocks();
  mockHttp.interceptors.request.use.mockReset();
  [mockHttp.get, mockHttp.post, mockHttp.put, mockHttp.patch, mockHttp.delete].forEach((m) => m.mockReset());
  mockHttp.get.mockResolvedValue({ data: { data: 'ok', current_page: 1 } });
});

test('getFigures usa /figures con los parámetros', async () => {
  await api.getFigures({ search: 'a', no_price: true, page: 2, per_page: 30 });
  expect(mockHttp.get).toHaveBeenCalledWith('/figures', { params: { search: 'a', no_price: true, page: 2, per_page: 30 } });
});

test('rutas de figuras: stats, crear, actualizar, stock y eliminar', async () => {
  mockHttp.post.mockResolvedValue({ data: { data: {} } });
  mockHttp.put.mockResolvedValue({ data: { data: {} } });
  mockHttp.patch.mockResolvedValue({ data: { data: {} } });

  await api.getFigureStats();
  await api.createFigure({ name: 'A', sku: 'X', price: 1, stock: 1 });
  await api.updateFigure(5, { price: 2 });
  await api.updateStock(5, 9);
  await api.deleteFigure(5);

  expect(mockHttp.get).toHaveBeenCalledWith('/figures/stats');
  expect(mockHttp.post).toHaveBeenCalledWith('/figures', expect.objectContaining({ name: 'A' }));
  expect(mockHttp.put).toHaveBeenCalledWith('/figures/5', { price: 2 });
  expect(mockHttp.patch).toHaveBeenCalledWith('/figures/5/stock', { stock: 9 });
  expect(mockHttp.delete).toHaveBeenCalledWith('/figures/5');
});

test('login guarda el token y el usuario de forma segura', async () => {
  mockHttp.post.mockResolvedValue({ data: { token: 'tok', user: { id: 1 } } });

  await api.login('a@a.com', 'x');

  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('api_token', 'tok');
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('user', JSON.stringify({ id: 1 }));
});

test('subir imágenes manda multipart a /upload/image(s) y devuelve las URLs', async () => {
  mockHttp.post.mockResolvedValueOnce({ data: { url: 'u1' } }).mockResolvedValueOnce({ data: { urls: ['u2', 'u3'] } });

  expect(await api.uploadImage('file:///a.jpg')).toBe('u1');
  expect(await api.uploadImages(['file:///b.jpg', 'file:///c.jpg'])).toEqual(['u2', 'u3']);

  expect(mockHttp.post.mock.calls[0][0]).toBe('/upload/image');
  expect(mockHttp.post.mock.calls[1][0]).toBe('/upload/images');
  expect(mockHttp.post.mock.calls[0][2].headers['Content-Type']).toBe('multipart/form-data');
});

test('el interceptor agrega el token y, ante un 401, borra la sesión y avisa a la app', async () => {
  (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('tok');
  const onUnauthorized = jest.fn();
  api.setUnauthorizedHandler(onUnauthorized);

  const config = await interceptors.request({ headers: {} });
  expect(config.headers.Authorization).toBe('Bearer tok');

  const errorInterceptor = interceptors.response;
  await expect(errorInterceptor({ response: { status: 401 } })).rejects.toBeTruthy();
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('api_token');
  expect(onUnauthorized).toHaveBeenCalled();

  onUnauthorized.mockClear();
  await expect(errorInterceptor({ response: { status: 422 } })).rejects.toBeTruthy();
  expect(onUnauthorized).not.toHaveBeenCalled();
});
