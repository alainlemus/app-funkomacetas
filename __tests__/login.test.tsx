import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../src/screens/LoginScreen';
import { alertSpy } from './helpers';

const mockLogin = jest.fn();
jest.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ login: mockLogin }) }));

beforeEach(() => jest.clearAllMocks());

test('muestra la versión de la app', () => {
  const { getByText } = render(<LoginScreen />);
  expect(getByText('v9.9.9')).toBeTruthy();
});

test('pide completar los campos', () => {
  const alert = alertSpy();
  const { getByText } = render(<LoginScreen />);

  fireEvent.press(getByText('Iniciar Sesion'));

  expect(alert).toHaveBeenCalledWith('Error', 'Por favor completa todos los campos');
  expect(mockLogin).not.toHaveBeenCalled();
});

test('inicia sesión con email y contraseña', async () => {
  mockLogin.mockResolvedValue(undefined);
  const { getByText, getByPlaceholderText } = render(<LoginScreen />);

  fireEvent.changeText(getByPlaceholderText('Email'), 'admin@x.com');
  fireEvent.changeText(getByPlaceholderText('Contrasena'), 'secreto');
  fireEvent.press(getByText('Iniciar Sesion'));

  await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('admin@x.com', 'secreto'));
});

test('muestra el mensaje del servidor si falla (credenciales o sin permisos)', async () => {
  const alert = alertSpy();
  mockLogin.mockRejectedValue({ response: { data: { errors: { email: ['Las credenciales son incorrectas.'] } } } });
  const { getByText, getByPlaceholderText } = render(<LoginScreen />);

  fireEvent.changeText(getByPlaceholderText('Email'), 'a@a.com');
  fireEvent.changeText(getByPlaceholderText('Contrasena'), 'mala');
  fireEvent.press(getByText('Iniciar Sesion'));

  await waitFor(() => expect(alert).toHaveBeenCalledWith('Error', 'Las credenciales son incorrectas.'));
});

test('sin conexión muestra un mensaje claro', async () => {
  const alert = alertSpy();
  mockLogin.mockRejectedValue({ message: 'Network Error' });
  const { getByText, getByPlaceholderText } = render(<LoginScreen />);

  fireEvent.changeText(getByPlaceholderText('Email'), 'a@a.com');
  fireEvent.changeText(getByPlaceholderText('Contrasena'), 'x');
  fireEvent.press(getByText('Iniciar Sesion'));

  await waitFor(() => expect(alert).toHaveBeenCalledWith('Error', expect.stringContaining('No hay conexión')));
});
