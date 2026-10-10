import React from 'react';
import { FlatList } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { FiguresScreen } from '../src/screens/FiguresScreen';
import { api } from '../src/services/api';
import { alertSpy, makeFigure, makeNavigation, page, pressAlertButton } from './helpers';

jest.mock('../src/services/api', () => ({
  api: { getFigures: jest.fn(), deleteFigure: jest.fn() },
}));

const getFigures = api.getFigures as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  getFigures.mockResolvedValue(page([makeFigure()]));
});

const mount = async (props: Record<string, any> = {}) => {
  const navigation = makeNavigation();
  const utils = render(<FiguresScreen navigation={navigation} route={{ params: {} }} {...props} />);
  await waitFor(() => expect(getFigures).toHaveBeenCalled());
  return { navigation, ...utils };
};

test('lista las figuras con precio, stock y SKU', async () => {
  getFigures.mockResolvedValue(page([makeFigure({ name: 'Goku' }), makeFigure({ id: 2, name: 'Vegeta', price: '0.00', is_active: false })], { total: 585 }));
  const { findByText, getByText, getAllByText } = await mount();

  expect(await findByText('Goku')).toBeTruthy();
  expect(getByText('$250.00')).toBeTruthy();
  expect(getByText('Figuras (585)')).toBeTruthy();
  expect(getByText('Inactiva')).toBeTruthy();
  expect(getAllByText('Sin precio').length).toBeGreaterThanOrEqual(2); // chip del filtro + tarjeta
});

test('pide la primera página con 30 por página (una sola petición al abrir)', async () => {
  await mount();
  expect(getFigures).toHaveBeenCalledTimes(1);
  expect(getFigures).toHaveBeenCalledWith(expect.objectContaining({ page: 1, per_page: 30 }));
});

test('la búsqueda se envía al servidor con retraso (debounce)', async () => {
  jest.useFakeTimers();
  const { getByPlaceholderText } = await mount();
  getFigures.mockClear();

  fireEvent.changeText(getByPlaceholderText('Buscar por nombre o SKU...'), 'gok');
  expect(getFigures).not.toHaveBeenCalled();

  await act(async () => jest.advanceTimersByTime(400));
  await waitFor(() => expect(getFigures).toHaveBeenCalledWith(expect.objectContaining({ search: 'gok', page: 1 })));
  jest.useRealTimers();
});

test.each([
  ['Activas', { active: true }],
  ['Inactivas', { active: false }],
  ['Sin precio', { no_price: true }],
  ['Stock bajo', { low_stock: true }],
])('el filtro "%s" manda sus parámetros', async (label, expected) => {
  const { getAllByText } = await mount();
  getFigures.mockClear();

  fireEvent.press(getAllByText(label)[0]);

  await waitFor(() => expect(getFigures).toHaveBeenCalledWith(expect.objectContaining(expected)));
});

test('"Todas" quita los filtros', async () => {
  const { getAllByText } = await mount();
  fireEvent.press(getAllByText('Sin precio')[0]);
  await waitFor(() => expect(getFigures).toHaveBeenLastCalledWith(expect.objectContaining({ no_price: true })));

  fireEvent.press(getAllByText('Todas')[0]);

  await waitFor(() => expect(getFigures).toHaveBeenLastCalledWith(expect.not.objectContaining({ no_price: true })));
});

test('al llegar al final carga la página siguiente y la agrega', async () => {
  getFigures
    .mockResolvedValueOnce(page([makeFigure({ id: 1, name: 'Aang' })], { current_page: 1, last_page: 2, total: 2 }))
    .mockResolvedValueOnce(page([makeFigure({ id: 2, name: 'Zoro' })], { current_page: 2, last_page: 2, total: 2 }));
  const { findByText, UNSAFE_getByType, getByText } = await mount();
  await findByText('Aang');

  fireEvent(UNSAFE_getByType(FlatList), 'endReached');

  expect(await findByText('Zoro')).toBeTruthy();
  expect(getByText('Aang')).toBeTruthy();
  expect(getFigures).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
});

test('no pide más páginas si ya está en la última', async () => {
  const { findByText, UNSAFE_getByType } = await mount();
  await findByText('Goku');
  getFigures.mockClear();

  fireEvent(UNSAFE_getByType(FlatList), 'endReached');

  expect(getFigures).not.toHaveBeenCalled();
});

test('tocar una figura abre el formulario; el botón + abre uno vacío', async () => {
  const { findByText, getByText, navigation } = await mount();

  fireEvent.press(await findByText('Goku'));
  expect(navigation.navigate).toHaveBeenCalledWith('FigureForm', { figure: expect.objectContaining({ id: 1 }) });

  fireEvent.press(getByText('+'));
  expect(navigation.navigate).toHaveBeenCalledWith('FigureForm', { figure: null });
});

test('mantener presionada una figura pide confirmación y la elimina', async () => {
  const alert = alertSpy();
  (api.deleteFigure as jest.Mock).mockResolvedValue(undefined);
  const { findByText } = await mount();

  fireEvent(await findByText('Goku'), 'longPress');
  expect(alert).toHaveBeenCalledWith('Eliminar Figura', expect.stringContaining('Goku'), expect.any(Array));

  getFigures.mockClear();
  pressAlertButton(alert, 'Eliminar');

  await waitFor(() => expect(api.deleteFigure).toHaveBeenCalledWith(1));
  await waitFor(() => expect(getFigures).toHaveBeenCalled()); // recarga la lista
});

test('si falla la carga avisa al usuario', async () => {
  const alert = alertSpy();
  getFigures.mockRejectedValue(new Error('x'));
  await mount();

  await waitFor(() => expect(alert).toHaveBeenCalledWith('Error', 'No se pudieron cargar las figuras'));
});

test('sin resultados muestra el estado vacío', async () => {
  getFigures.mockResolvedValue(page([]));
  const { findByText } = await mount();
  expect(await findByText('No hay figuras')).toBeTruthy();
});

test('abre con el filtro que mandó el tablero (Sin precio)', async () => {
  await mount({ route: { params: { filter: 'no_price' } } });
  await waitFor(() => expect(getFigures).toHaveBeenCalledWith(expect.objectContaining({ no_price: true })));
});
