import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { AppNavigator } from '../src/navigation/AppNavigator';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

let mockAuth = { isAuthenticated: false, isLoading: false };
jest.mock('../src/context/AuthContext', () => ({ useAuth: () => mockAuth }));

jest.mock('../src/screens/LoginScreen', () => ({ LoginScreen: () => require('react').createElement(require('react-native').Text, null, 'PANTALLA-LOGIN') }));
jest.mock('../src/screens/DashboardScreen', () => ({ DashboardScreen: () => require('react').createElement(require('react-native').Text, null, 'PANTALLA-TABLERO') }));
jest.mock('../src/screens/FiguresScreen', () => ({ FiguresScreen: () => require('react').createElement(require('react-native').Text, null, 'PANTALLA-FIGURAS') }));
jest.mock('../src/screens/CategoriesScreen', () => ({ CategoriesScreen: () => require('react').createElement(require('react-native').Text, null, 'PANTALLA-CATEGORIAS') }));
jest.mock('../src/screens/FigureFormScreen', () => ({ FigureFormScreen: () => require('react').createElement(require('react-native').Text, null, 'PANTALLA-FORM') }));

test('sin sesión muestra el login', async () => {
  mockAuth = { isAuthenticated: false, isLoading: false };
  render(<AppNavigator />);
  expect(await screen.findByText('PANTALLA-LOGIN')).toBeTruthy();
});

test('mientras carga la sesión muestra la pantalla de arranque', () => {
  mockAuth = { isAuthenticated: false, isLoading: true };
  render(<AppNavigator />);
  expect(screen.getByText('Funkomacetas')).toBeTruthy();
  expect(screen.queryByText('PANTALLA-LOGIN')).toBeNull();
});

test('con sesión muestra el tablero y las tres pestañas', async () => {
  mockAuth = { isAuthenticated: true, isLoading: false };
  render(<AppNavigator />);

  expect(await screen.findByText('PANTALLA-TABLERO')).toBeTruthy();
  expect(screen.getByText('Dashboard')).toBeTruthy();
  expect(screen.getByText('Figuras')).toBeTruthy();
  expect(screen.getByText('Categorias')).toBeTruthy();
  expect(screen.queryByText('Productos')).toBeNull(); // la pestaña vieja ya no existe
});
