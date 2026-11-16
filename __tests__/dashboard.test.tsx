import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { DashboardScreen } from '../src/screens/DashboardScreen';
import { api } from '../src/services/api';
import { alertSpy, makeFigure, makeNavigation, pressAlertButton } from './helpers';

jest.mock('../src/services/api', () => ({
  api: { getFigureStats: jest.fn(), updateStock: jest.fn() },
}));
const mockLogout = jest.fn();
jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Admin' }, logout: mockLogout }),
}));

const stats = {
  total: 585,
  active: 119,
  inactive: 466,
  no_price: 466,
  low_stock: 1,
  out_of_stock: 0,
  inventory_value: 1234.5,
  investment: 5280,
  investment_figures: 44,
  investment_missing_cost: 3,
  categories: 7,
  low_stock_items: [makeFigure({ id: 9, name: 'Goku bajo', stock: 2, min_stock: 5 })],
};

beforeEach(() => {
  jest.clearAllMocks();
  (api.getFigureStats as jest.Mock).mockResolvedValue(stats);
});

const mount = async () => {
  const navigation = makeNavigation();
  const utils = render(<DashboardScreen navigation={navigation} />);
  await utils.findByText('Hola, Admin');
  return { navigation, ...utils };
};

test('muestra los totales de todo el inventario', async () => {
  const { getByText } = await mount();

  expect(getByText('585')).toBeTruthy();
  expect(getByText('Figuras (119 activas)')).toBeTruthy();
  expect(getByText('466')).toBeTruthy();
  expect(getByText('7')).toBeTruthy();
  expect(getByText('$1,234.50')).toBeTruthy();
});

test('muestra la inversión (costo de las figuras con stock) y avisa si faltan costos', async () => {
  const { getByText } = await mount();

  expect(getByText('Inversión')).toBeTruthy();
  expect(getByText('$5,280.00')).toBeTruthy();
  expect(getByText('Costo de 44 figuras con stock')).toBeTruthy();
  expect(getByText('3 sin costo capturado')).toBeTruthy();
});

test('sin figuras sin costo no muestra el aviso', async () => {
  (api.getFigureStats as jest.Mock).mockResolvedValue({ ...stats, investment_missing_cost: 0 });
  const { findByText, queryByText } = await mount();

  expect(await findByText('$5,280.00')).toBeTruthy();
  expect(queryByText(/sin costo capturado/)).toBeNull();
});

test('las tarjetas abren el listado ya filtrado', async () => {
  const { getByText, getAllByText, navigation } = await mount();

  fireEvent.press(getByText('Sin Precio'));
  expect(navigation.navigate).toHaveBeenLastCalledWith('Figuras', { filter: 'no_price' });

  fireEvent.press(getByText('Stock Bajo'));
  expect(navigation.navigate).toHaveBeenLastCalledWith('Figuras', { filter: 'low_stock' });

  fireEvent.press(getByText('Figuras (119 activas)'));
  expect(navigation.navigate).toHaveBeenLastCalledWith('Figuras', { filter: 'all' });

  fireEvent.press(getAllByText('Categorias')[0]);
  expect(navigation.navigate).toHaveBeenLastCalledWith('Categorias');
});

test('las acciones rápidas abren una figura nueva', async () => {
  const { getByText, navigation } = await mount();

  fireEvent.press(getByText('Nueva Figura'));

  expect(navigation.navigate).toHaveBeenCalledWith('FigureForm', { figure: null });
});

test('lista las figuras con stock bajo y "+10" suma al stock actual', async () => {
  (api.updateStock as jest.Mock).mockResolvedValue({});
  const { getByText } = await mount();
  expect(getByText('Goku bajo')).toBeTruthy();
  expect(getByText('Stock: 2 / Min: 5')).toBeTruthy();

  fireEvent.press(getByText('+10'));

  await waitFor(() => expect(api.updateStock).toHaveBeenCalledWith(9, 12));
  await waitFor(() => expect(api.getFigureStats).toHaveBeenCalledTimes(2)); // refresca el tablero
});

test('si no se puede actualizar el stock avisa', async () => {
  const alert = alertSpy();
  (api.updateStock as jest.Mock).mockRejectedValue(new Error('x'));
  const { getByText } = await mount();

  fireEvent.press(getByText('+10'));

  await waitFor(() => expect(alert).toHaveBeenCalledWith('Error', 'No se pudo actualizar el stock'));
});

test('salir pide confirmación y cierra sesión', async () => {
  const alert = alertSpy();
  const { getByText } = await mount();

  fireEvent.press(getByText('Salir'));
  expect(alert).toHaveBeenCalledWith('Cerrar Sesion', expect.any(String), expect.any(Array));

  pressAlertButton(alert, 'Cerrar Sesion');
  expect(mockLogout).toHaveBeenCalled();
});

test('sin figuras con stock bajo no muestra esa sección', async () => {
  (api.getFigureStats as jest.Mock).mockResolvedValue({ ...stats, low_stock: 0, low_stock_items: [] });
  const { queryByText } = await mount();

  expect(queryByText('⚠️ Figuras con Stock Bajo')).toBeNull();
});
