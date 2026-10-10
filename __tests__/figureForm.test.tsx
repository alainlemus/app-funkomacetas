import React from 'react';
import { Switch } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { FigureFormScreen } from '../src/screens/FigureFormScreen';
import { api } from '../src/services/api';
import { alertSpy, makeFigure, makeNavigation } from './helpers';

jest.mock('../src/services/api', () => ({
  api: {
    getCategories: jest.fn(),
    createFigure: jest.fn(),
    updateFigure: jest.fn(),
    uploadImage: jest.fn(),
    uploadImages: jest.fn(),
  },
}));

const picker = ImagePicker as jest.Mocked<typeof ImagePicker>;

beforeEach(() => {
  jest.clearAllMocks();
  (api.getCategories as jest.Mock).mockResolvedValue([{ id: 1, name: 'Personajes' }, { id: 2, name: 'Posket' }]);
  (api.createFigure as jest.Mock).mockResolvedValue({});
  (api.updateFigure as jest.Mock).mockResolvedValue({});
});

const mount = async (figure: any = null) => {
  const navigation = makeNavigation();
  const utils = render(<FigureFormScreen navigation={navigation} route={{ params: { figure } }} />);
  await waitFor(() => expect(api.getCategories).toHaveBeenCalled());
  await utils.findByText('Personajes'); // categorías cargadas
  return { navigation, ...utils };
};

const fill = (utils: any, values: { name?: string; sku?: string; price?: string; stock?: string }) => {
  if (values.name !== undefined) fireEvent.changeText(utils.getByPlaceholderText('Nombre de la figura'), values.name);
  if (values.sku !== undefined) fireEvent.changeText(utils.getByPlaceholderText('SKU-001'), values.sku);
  if (values.price !== undefined) fireEvent.changeText(utils.getAllByPlaceholderText('0.00')[0], values.price);
  if (values.stock !== undefined) fireEvent.changeText(utils.getByPlaceholderText('0'), values.stock);
};

describe('crear figura', () => {
  test('exige nombre y SKU', async () => {
    const alert = alertSpy();
    const utils = await mount();

    fireEvent.press(utils.getByText('Crear Figura'));
    expect(alert).toHaveBeenLastCalledWith('Error', 'El nombre es requerido');

    fill(utils, { name: 'Goku' });
    fireEvent.press(utils.getByText('Crear Figura'));
    expect(alert).toHaveBeenLastCalledWith('Error', 'El SKU es requerido');
    expect(api.createFigure).not.toHaveBeenCalled();
  });

  test('una figura activa necesita precio mayor a 0', async () => {
    const alert = alertSpy();
    const utils = await mount();
    fill(utils, { name: 'Goku', sku: 'FM-1', price: '0' });

    fireEvent.press(utils.getByText('Crear Figura'));

    expect(alert).toHaveBeenLastCalledWith('Error', expect.stringContaining('precio'));
    expect(api.createFigure).not.toHaveBeenCalled();
  });

  test('una figura inactiva se puede guardar sin precio', async () => {
    const utils = await mount();
    fill(utils, { name: 'Goku', sku: 'FM-1' });
    fireEvent(utils.UNSAFE_getAllByType(Switch)[1], 'valueChange', false); // Activo → apagado

    fireEvent.press(utils.getByText('Crear Figura'));

    await waitFor(() =>
      expect(api.createFigure).toHaveBeenCalledWith(expect.objectContaining({ name: 'Goku', sku: 'FM-1', price: 0, is_active: false }))
    );
  });

  test('guarda con categoría, precio y stock y regresa a la lista', async () => {
    const utils = await mount();
    fill(utils, { name: '  Vegeta ', sku: ' FM-2 ', price: '300.5', stock: '4' });
    fireEvent.press(utils.getByText('Posket'));

    fireEvent.press(utils.getByText('Crear Figura'));

    await waitFor(() =>
      expect(api.createFigure).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Vegeta', sku: 'FM-2', price: 300.5, stock: 4, category_id: 2, is_active: true, is_featured: false })
      )
    );
    expect(utils.navigation.goBack).toHaveBeenCalled();
  });

  test('crear sin fotos no manda image null', async () => {
    const utils = await mount();
    fill(utils, { name: 'Goku', sku: 'FM-1', price: '10' });
    fireEvent.press(utils.getByText('Crear Figura'));

    await waitFor(() => expect(api.createFigure).toHaveBeenCalled());
    const payload = (api.createFigure as jest.Mock).mock.calls[0][0];
    expect(payload.image).toBeUndefined();
    expect(payload.images).toBeUndefined();
  });

  test('muestra el error de validación del servidor (SKU repetido)', async () => {
    const alert = alertSpy();
    (api.createFigure as jest.Mock).mockRejectedValue({ response: { data: { errors: { sku: ['The sku has already been taken.'] } } } });
    const utils = await mount();
    fill(utils, { name: 'Goku', sku: 'FM-1', price: '10' });

    fireEvent.press(utils.getByText('Crear Figura'));

    await waitFor(() => expect(alert).toHaveBeenCalledWith('Error', 'The sku has already been taken.'));
    expect(utils.navigation.goBack).not.toHaveBeenCalled();
  });
});

describe('editar figura', () => {
  const figure = makeFigure({
    image: 'http://x/storage/funkomacetas/a.webp',
    images: ['http://x/storage/funkomacetas/b.webp'],
    category_id: 1,
    is_featured: true,
  });

  test('carga los datos y las fotos (principal + adicionales)', async () => {
    const utils = await mount(figure);

    expect(utils.getByDisplayValue('Goku')).toBeTruthy();
    expect(utils.getByDisplayValue('FM-0001')).toBeTruthy();
    expect(utils.getByDisplayValue('250.00')).toBeTruthy();
    expect(utils.getByText('Actualizar')).toBeTruthy();
    expect(utils.getAllByText('×')).toHaveLength(2); // dos fotos
    expect(utils.getByText('Principal')).toBeTruthy();
  });

  test('la foto principal no se duplica si también viene en la lista', async () => {
    const utils = await mount(makeFigure({ image: 'http://x/a.webp', images: ['http://x/a.webp', 'http://x/b.webp'] }));
    expect(utils.getAllByText('×')).toHaveLength(2);
  });

  test('actualiza mandando la lista completa de fotos', async () => {
    const utils = await mount(figure);

    fireEvent.press(utils.getByText('Actualizar'));

    await waitFor(() =>
      expect(api.updateFigure).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ image: figure.image, images: [figure.image, figure.images[0]], price: 250 })
      )
    );
  });

  test('quitar todas las fotos las borra (image null, images [])', async () => {
    const utils = await mount(figure);
    fireEvent.press(utils.getAllByText('×')[0]);
    fireEvent.press(utils.getAllByText('×')[0]);

    fireEvent.press(utils.getByText('Actualizar'));

    await waitFor(() => expect(api.updateFigure).toHaveBeenCalled());
    const payload = (api.updateFigure as jest.Mock).mock.calls[0][1];
    expect(payload.image).toBeNull();
    expect(payload.images).toEqual([]);
  });

  test('desactivar una figura sin precio es válido', async () => {
    const utils = await mount(makeFigure({ price: '0.00', is_active: false }));
    fireEvent.press(utils.getByText('Actualizar'));

    await waitFor(() => expect(api.updateFigure).toHaveBeenCalledWith(1, expect.objectContaining({ price: 0, is_active: false })));
  });

  test('activar una figura sin precio se bloquea', async () => {
    const alert = alertSpy();
    const utils = await mount(makeFigure({ price: '0.00', is_active: false }));
    fireEvent(utils.UNSAFE_getAllByType(Switch)[1], 'valueChange', true);

    fireEvent.press(utils.getByText('Actualizar'));

    expect(alert).toHaveBeenLastCalledWith('Error', expect.stringContaining('precio'));
    expect(api.updateFigure).not.toHaveBeenCalled();
  });
});

describe('fotos', () => {
  const asset = { uri: 'file:///foto.jpg', width: 4000, height: 3000 };

  test('la galería comprime, sube y agrega las fotos (la primera queda como principal)', async () => {
    picker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    picker.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [asset, { ...asset, uri: 'file:///b.jpg' }] } as any);
    (api.uploadImages as jest.Mock).mockResolvedValue(['http://x/storage/1.webp', 'http://x/storage/2.webp']);
    const utils = await mount();
    fill(utils, { name: 'Goku', sku: 'FM-1', price: '10' });

    fireEvent.press(utils.getByText('🖼️ Galeria'));

    await waitFor(() => expect(utils.getAllByText('×')).toHaveLength(2));
    expect((api.uploadImages as jest.Mock).mock.calls[0][0]).toEqual(['file:///foto.jpg#c', 'file:///b.jpg#c']); // pasaron por el compresor
    expect(utils.getByText('Principal')).toBeTruthy();

    fireEvent.press(utils.getByText('Crear Figura'));
    await waitFor(() =>
      expect(api.createFigure).toHaveBeenCalledWith(
        expect.objectContaining({ image: 'http://x/storage/1.webp', images: ['http://x/storage/1.webp', 'http://x/storage/2.webp'] })
      )
    );
  });

  test('reduce por el lado mayor (foto vertical de 3000×4000)', async () => {
    const manipulator = require('expo-image-manipulator');
    picker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    picker.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///v.jpg', width: 3000, height: 4000 }] } as any);
    (api.uploadImages as jest.Mock).mockResolvedValue(['http://x/1.webp']);
    const utils = await mount();

    fireEvent.press(utils.getByText('🖼️ Galeria'));

    await waitFor(() => expect(manipulator.manipulateAsync).toHaveBeenCalled());
    expect(manipulator.manipulateAsync.mock.calls[0][1]).toEqual([{ resize: { height: 1200 } }]);
  });

  test('sin permiso de galería avisa y no abre el selector', async () => {
    const alert = alertSpy();
    picker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'denied' } as any);
    const utils = await mount();

    fireEvent.press(utils.getByText('🖼️ Galeria'));

    await waitFor(() => expect(alert).toHaveBeenCalledWith('Permiso denegado', expect.stringContaining('galeria')));
    expect(picker.launchImageLibraryAsync).not.toHaveBeenCalled();
  });

  test('la cámara sube una foto', async () => {
    picker.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    picker.launchCameraAsync.mockResolvedValue({ canceled: false, assets: [asset] } as any);
    (api.uploadImage as jest.Mock).mockResolvedValue('http://x/storage/cam.webp');
    const utils = await mount();

    fireEvent.press(utils.getByText('📷 Tomar foto'));

    await waitFor(() => expect(api.uploadImage).toHaveBeenCalledWith('file:///foto.jpg#c'));
    expect(await utils.findByText('Principal')).toBeTruthy();
  });

  test('sin permiso de cámara avisa', async () => {
    const alert = alertSpy();
    picker.requestCameraPermissionsAsync.mockResolvedValue({ status: 'denied' } as any);
    const utils = await mount();

    fireEvent.press(utils.getByText('📷 Tomar foto'));

    await waitFor(() => expect(alert).toHaveBeenCalledWith('Permiso denegado', expect.stringContaining('camara')));
  });

  test('cancelar el selector no sube nada', async () => {
    picker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    picker.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: null } as any);
    const utils = await mount();

    fireEvent.press(utils.getByText('🖼️ Galeria'));

    await waitFor(() => expect(picker.launchImageLibraryAsync).toHaveBeenCalled());
    expect(api.uploadImages).not.toHaveBeenCalled();
  });

  test('si el servidor rechaza la imagen muestra su mensaje', async () => {
    const alert = alertSpy();
    picker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    picker.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [asset] } as any);
    (api.uploadImages as jest.Mock).mockRejectedValue({ response: { data: { errors: { 'images.0': ['El archivo no es una imagen válida.'] } } } });
    const utils = await mount();

    fireEvent.press(utils.getByText('🖼️ Galeria'));

    await waitFor(() => expect(alert).toHaveBeenCalledWith('Error', 'El archivo no es una imagen válida.'));
  });

  test('marcar otra foto como principal y eliminar la principal', async () => {
    const utils = await mount(makeFigure({ image: 'http://x/a.webp', images: ['http://x/b.webp'] }));

    fireEvent.press(utils.getByText('Hacer principal')); // b pasa a ser la principal
    fireEvent.press(utils.getByText('Actualizar'));
    await waitFor(() => expect(api.updateFigure).toHaveBeenCalledWith(1, expect.objectContaining({ image: 'http://x/b.webp' })));
  });

  test('eliminar la principal promueve la siguiente', async () => {
    const utils = await mount(makeFigure({ image: 'http://x/a.webp', images: ['http://x/b.webp'] }));

    fireEvent.press(utils.getAllByText('×')[0]); // elimina a.webp (principal) → b pasa a principal
    expect(utils.getAllByText('×')).toHaveLength(1);
    expect(utils.getByText('Principal')).toBeTruthy();
    expect(utils.queryByText('Hacer principal')).toBeNull();
  });
});
