import { Alert } from 'react-native';

export const makeFigure = (over: Record<string, any> = {}) => ({
  id: 1,
  name: 'Goku',
  slug: 'goku',
  sku: 'FM-0001',
  description: null,
  price: '250.00',
  cost: '120.00',
  stock: 3,
  min_stock: 5,
  image: null,
  images: [],
  is_active: true,
  is_featured: false,
  category_id: null,
  category: { id: 1, name: 'Personajes' },
  created_at: '',
  updated_at: '',
  ...over,
});

export const page = (data: any[], over: Record<string, any> = {}) => ({
  current_page: 1,
  last_page: 1,
  total: data.length,
  data,
  ...over,
});

/** Navegación falsa: ejecuta los listeners 'focus' de inmediato. */
export const makeNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  setParams: jest.fn(),
  addListener: jest.fn((_event: string, cb: () => void) => {
    cb();
    return () => undefined;
  }),
});

export const alertSpy = () => jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

/** Pulsa el botón de un Alert.alert con confirmación. */
export const pressAlertButton = (spy: jest.SpyInstance, label: string) => {
  const buttons = spy.mock.calls.at(-1)?.[2] as { text: string; onPress?: () => void }[];
  buttons.find((b) => b.text === label)?.onPress?.();
};
