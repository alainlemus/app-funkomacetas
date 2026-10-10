import React from 'react';
import { Text } from 'react-native';
import { render, waitFor, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { api } from '../src/services/api';

jest.mock('../src/services/api', () => ({
  api: {
    login: jest.fn(),
    logout: jest.fn().mockResolvedValue(undefined),
    getUser: jest.fn(),
    setUnauthorizedHandler: jest.fn(),
  },
}));

let ctx: ReturnType<typeof useAuth>;
function Probe() {
  ctx = useAuth();
  return <Text>{ctx.isAuthenticated ? `dentro:${ctx.user?.name}` : 'fuera'}</Text>;
}

const mount = async () => {
  const utils = render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
  await waitFor(() => expect(ctx.isLoading).toBe(false));
  return utils;
};

beforeEach(() => jest.clearAllMocks());

test('inicia sesión como administrador', async () => {
  (api.login as jest.Mock).mockResolvedValue({ user: { id: 1, name: 'Admin', is_admin: true }, token: 't' });
  const { getByText } = await mount();

  await act(async () => ctx.login('a@a.com', 'x'));

  expect(getByText('dentro:Admin')).toBeTruthy();
});

test('rechaza a un usuario sin permisos de administrador y cierra su sesión', async () => {
  (api.login as jest.Mock).mockResolvedValue({ user: { id: 2, name: 'Cliente', is_admin: false }, token: 't' });
  const { getByText } = await mount();

  await expect(act(async () => ctx.login('c@c.com', 'x'))).rejects.toMatchObject({
    response: { data: { message: expect.stringContaining('permisos') } },
  });

  expect(api.logout).toHaveBeenCalled();
  expect(getByText('fuera')).toBeTruthy();
});

test('credenciales incorrectas no dejan la sesión abierta', async () => {
  (api.login as jest.Mock).mockRejectedValue({ response: { status: 422 } });
  const { getByText } = await mount();

  await expect(act(async () => ctx.login('a@a.com', 'mala'))).rejects.toBeTruthy();
  expect(getByText('fuera')).toBeTruthy();
});

test('una respuesta 401 de la API cierra la sesión en la app', async () => {
  (api.login as jest.Mock).mockResolvedValue({ user: { id: 1, name: 'Admin', is_admin: true }, token: 't' });
  const { getByText } = await mount();
  await act(async () => ctx.login('a@a.com', 'x'));
  expect(getByText('dentro:Admin')).toBeTruthy();

  const handler = (api.setUnauthorizedHandler as jest.Mock).mock.calls[0][0];
  act(() => handler());

  expect(getByText('fuera')).toBeTruthy();
});

test('cerrar sesión limpia al usuario', async () => {
  (api.login as jest.Mock).mockResolvedValue({ user: { id: 1, name: 'Admin', is_admin: true }, token: 't' });
  const { getByText } = await mount();
  await act(async () => ctx.login('a@a.com', 'x'));

  await act(async () => ctx.logout());

  expect(api.logout).toHaveBeenCalled();
  expect(getByText('fuera')).toBeTruthy();
});
