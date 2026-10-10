import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { CategoriesScreen } from '../src/screens/CategoriesScreen';
import { api } from '../src/services/api';
import { alertSpy, makeNavigation, pressAlertButton } from './helpers';

jest.mock('../src/services/api', () => ({
  api: { getCategories: jest.fn(), createCategory: jest.fn(), updateCategory: jest.fn(), deleteCategory: jest.fn() },
}));

const cat = (over: any = {}) => ({ id: 1, name: 'Marvel', slug: 'marvel', description: 'Héroes', is_active: true, figures_count: 4, ...over });

beforeEach(() => {
  jest.clearAllMocks();
  (api.getCategories as jest.Mock).mockResolvedValue([cat(), cat({ id: 2, name: 'DC', description: null, is_active: false, figures_count: 0 })]);
});

const mount = async () => {
  const navigation = makeNavigation();
  const utils = render(<CategoriesScreen navigation={navigation} />);
  await utils.findByText('Marvel');
  return { navigation, ...utils };
};

test('lista las categorías con su número de figuras y estado', async () => {
  const { getByText } = await mount();

  expect(getByText('4 figuras')).toBeTruthy();
  expect(getByText('0 figuras')).toBeTruthy();
  expect(getByText('Inactivo')).toBeTruthy();
});

test('busca por nombre', async () => {
  const { getByPlaceholderText, queryByText } = await mount();

  fireEvent.changeText(getByPlaceholderText('Buscar categoria...'), 'dc');

  expect(queryByText('Marvel')).toBeNull();
  expect(queryByText('DC')).toBeTruthy();
});

test('crear exige nombre y luego guarda y recarga', async () => {
  const alert = alertSpy();
  (api.createCategory as jest.Mock).mockResolvedValue({});
  const { getByText, getByPlaceholderText } = await mount();

  fireEvent.press(getByText('+'));
  fireEvent.press(getByText('Guardar'));
  expect(alert).toHaveBeenLastCalledWith('Error', 'El nombre es requerido');

  fireEvent.changeText(getByPlaceholderText('Nombre de la categoria'), '  Anime ');
  fireEvent.press(getByText('Guardar'));

  await waitFor(() => expect(api.createCategory).toHaveBeenCalledWith({ name: 'Anime', description: undefined, is_active: true }));
  await waitFor(() => expect(api.getCategories).toHaveBeenCalledTimes(2));
});

test('editar carga los datos y actualiza', async () => {
  (api.updateCategory as jest.Mock).mockResolvedValue({});
  const { getByText, getByDisplayValue } = await mount();

  fireEvent.press(getByText('Marvel'));
  expect(getByDisplayValue('Marvel')).toBeTruthy();
  expect(getByText('Editar Categoria')).toBeTruthy();

  fireEvent.press(getByText('Guardar'));

  await waitFor(() => expect(api.updateCategory).toHaveBeenCalledWith(1, { name: 'Marvel', description: 'Héroes', is_active: true }));
});

test('un nombre repetido muestra el error del servidor', async () => {
  const alert = alertSpy();
  (api.createCategory as jest.Mock).mockRejectedValue({ response: { data: { errors: { name: ['The name has already been taken.'] } } } });
  const { getByText, getByPlaceholderText } = await mount();

  fireEvent.press(getByText('+'));
  fireEvent.changeText(getByPlaceholderText('Nombre de la categoria'), 'Marvel');
  fireEvent.press(getByText('Guardar'));

  await waitFor(() => expect(alert).toHaveBeenCalledWith('Error', 'The name has already been taken.'));
});

test('eliminar una categoría con figuras muestra el motivo', async () => {
  const alert = alertSpy();
  (api.deleteCategory as jest.Mock).mockRejectedValue({ response: { data: { message: 'No se puede eliminar la categoría porque tiene figuras asociadas' } } });
  const { getByText } = await mount();

  fireEvent(getByText('Marvel'), 'longPress');
  pressAlertButton(alert, 'Eliminar');

  await waitFor(() => expect(alert).toHaveBeenLastCalledWith('Error', expect.stringContaining('figuras asociadas')));
});

test('eliminar una categoría vacía la quita y recarga', async () => {
  const alert = alertSpy();
  (api.deleteCategory as jest.Mock).mockResolvedValue(undefined);
  const { getByText } = await mount();

  fireEvent(getByText('DC'), 'longPress');
  pressAlertButton(alert, 'Eliminar');

  await waitFor(() => expect(api.deleteCategory).toHaveBeenCalledWith(2));
  await waitFor(() => expect(api.getCategories).toHaveBeenCalledTimes(2));
});

test('si falla la carga avisa', async () => {
  const alert = alertSpy();
  (api.getCategories as jest.Mock).mockRejectedValue(new Error('x'));
  render(<CategoriesScreen navigation={makeNavigation()} />);

  await waitFor(() => expect(alert).toHaveBeenCalledWith('Error', 'No se pudieron cargar las categorias'));
});
