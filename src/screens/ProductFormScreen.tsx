import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';
import { Funkomaceta, Category, Figure } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';

export function ProductFormScreen({ navigation, route }: any) {
  const product = route.params?.product;
  const isEditing = !!product;

  const [name, setName] = useState(product?.name || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [price, setPrice] = useState(product?.price ? String(product.price) : '');
  const [stock, setStock] = useState(product?.stock ? String(product.stock) : '0');
  const [cost, setCost] = useState(product?.cost ? String(product.cost) : '');
  const [minStock, setMinStock] = useState(product?.min_stock ? String(product.min_stock) : '5');
  const [description, setDescription] = useState(product?.description || '');
  const [categoryId, setCategoryId] = useState<number | null>(product?.category_id || null);
  const [figureId, setFigureId] = useState<number | null>(product?.figure_id || null);
  const [isFeatured, setIsFeatured] = useState(product?.is_featured || false);
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [mainImage, setMainImage] = useState<string>(product?.image || '');

  const [categories, setCategories] = useState<Category[]>([]);
  const [figures, setFigures] = useState<Figure[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cats, figs] = await Promise.all([
        api.getCategories(),
        api.getFigures(),
      ]);
      setCategories(cats);
      setFigures(figs);
    } catch {
      // Silently fail
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setIsLoading(true);
      try {
        const url = await api.uploadImage(uri);
        if (images.length === 0 && !mainImage) {
          setMainImage(url);
        }
        setImages([...images, url]);
      } catch (error: any) {
        console.log('[UPLOAD ERROR single]', {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data,
          code: error?.code,
        });
        const msg =
          error?.response?.data?.message ||
          error?.response?.data?.errors?.image?.[0] ||
          error?.message ||
          'No se pudo subir la imagen';
        Alert.alert('Error al subir', `${msg}\n\nStatus: ${error?.response?.status ?? 'N/A'}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const takeMultiplePhotos = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitas dar permiso a la camara para tomar fotos');
      return;
    }

    const newImages: string[] = [];

    const askToContinue = (count: number): Promise<boolean> => {
      return new Promise((resolve) => {
        Alert.alert(
          '¿Tomar otra foto?',
          `Tienes ${count} foto(s). ¿Deseas tomar otra o terminar?`,
          [
            { text: 'Terminar', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Otra foto', onPress: () => resolve(true) },
          ],
          { cancelable: false }
        );
      });
    };

    let shouldContinue = true;

    while (shouldContinue) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false,
      });

      if (result.canceled || !result.assets?.[0]) {
        break;
      }

      newImages.push(result.assets[0].uri);
      shouldContinue = await askToContinue(newImages.length);
    }

    if (newImages.length > 0) {
      setIsLoading(true);
      try {
        const urls = await api.uploadImages(newImages);
        setImages([...images, ...urls]);
        if (!mainImage && urls.length > 0) {
          setMainImage(urls[0]);
        }
      } catch (error: any) {
        console.log('[UPLOAD ERROR]', {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data,
          code: error?.code,
        });
        const msg =
          error?.response?.data?.message ||
          error?.response?.data?.errors?.images?.[0] ||
          error?.message ||
          'No se pudieron subir las imagenes';
        Alert.alert('Error al subir', `${msg}\n\nStatus: ${error?.response?.status ?? 'N/A'}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const pickMultipleImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitas dar permiso a la galeria para seleccionar imagenes');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uris = result.assets.map((a) => a.uri);
      setIsLoading(true);
      try {
        const urls = await api.uploadImages(uris);
        setImages([...images, ...urls]);
        if (!mainImage && urls.length > 0) {
          setMainImage(urls[0]);
        }
      } catch (error: any) {
        console.log('[UPLOAD ERROR]', {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data,
          code: error?.code,
        });
        const msg =
          error?.response?.data?.message ||
          error?.response?.data?.errors?.images?.[0] ||
          error?.message ||
          'No se pudieron subir las imagenes';
        Alert.alert('Error al subir', `${msg}\n\nStatus: ${error?.response?.status ?? 'N/A'}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    const removed = newImages.splice(index, 1)[0];
    setImages(newImages);
    if (removed === mainImage) {
      setMainImage(newImages[0] || '');
    }
  };

  const setAsMain = (image: string) => {
    setMainImage(image);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }
    if (!sku.trim()) {
      Alert.alert('Error', 'El SKU es requerido');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Error', 'El precio debe ser mayor a 0');
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        name: name.trim(),
        sku: sku.trim(),
        price: parseFloat(price),
        stock: parseInt(stock) || 0,
        cost: cost ? parseFloat(cost) : undefined,
        min_stock: parseInt(minStock) || 5,
        description: description.trim() || undefined,
        category_id: categoryId || undefined,
        figure_id: figureId || undefined,
        is_featured: isFeatured,
        is_active: isActive,
        image: mainImage || undefined,
        images: images.length > 0 ? images : undefined,
      };

      if (isEditing) {
        await api.updateProduct(product.id, data);
      } else {
        await api.createProduct(data);
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo guardar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <Text style={styles.label}>Nombre *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nombre del producto" />

            <Text style={styles.label}>SKU *</Text>
            <TextInput style={styles.input} value={sku} onChangeText={setSku} placeholder="SKU-001" autoCapitalize="characters" />

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Precio *</Text>
                <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="0.00" keyboardType="decimal-pad" />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>Costo</Text>
                <TextInput style={styles.input} value={cost} onChangeText={setCost} placeholder="0.00" keyboardType="decimal-pad" />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Stock</Text>
                <TextInput style={styles.input} value={stock} onChangeText={setStock} placeholder="0" keyboardType="number-pad" />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>Stock Minimo</Text>
                <TextInput style={styles.input} value={minStock} onChangeText={setMinStock} placeholder="5" keyboardType="number-pad" />
              </View>
            </View>

            <Text style={styles.label}>Descripcion</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Descripcion del producto"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Categoria</Text>
            <View style={styles.chipContainer}>
              <TouchableOpacity
                style={[styles.chip, !categoryId && styles.chipSelected]}
                onPress={() => setCategoryId(null)}
              >
                <Text style={[styles.chipText, !categoryId && styles.chipTextSelected]}>Ninguna</Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, categoryId === cat.id && styles.chipSelected]}
                  onPress={() => setCategoryId(cat.id)}
                >
                  <Text style={[styles.chipText, categoryId === cat.id && styles.chipTextSelected]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Figura</Text>
            <View style={styles.chipContainer}>
              <TouchableOpacity
                style={[styles.chip, !figureId && styles.chipSelected]}
                onPress={() => setFigureId(null)}
              >
                <Text style={[styles.chipText, !figureId && styles.chipTextSelected]}>Ninguna</Text>
              </TouchableOpacity>
              {figures.map((fig) => (
                <TouchableOpacity
                  key={fig.id}
                  style={[styles.chip, figureId === fig.id && styles.chipSelected]}
                  onPress={() => setFigureId(fig.id)}
                >
                  <Text style={[styles.chipText, figureId === fig.id && styles.chipTextSelected]}>{fig.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.label}>Producto Destacado</Text>
              <Switch value={isFeatured} onValueChange={setIsFeatured} trackColor={{ false: '#DFE6E9', true: '#A29BFE' }} />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.label}>Activo</Text>
              <Switch value={isActive} onValueChange={setIsActive} trackColor={{ false: '#DFE6E9', true: '#A29BFE' }} />
            </View>

            <Text style={styles.label}>Imagenes</Text>
            <View style={styles.imagesSection}>
              {images.length > 0 && (
                <ScrollView horizontal style={styles.imageList} showsHorizontalScrollIndicator={false}>
                  {images.map((img, index) => (
                    <View key={index} style={styles.imageItem}>
                      <Image source={{ uri: img }} style={styles.thumbnail} />
                      {img === mainImage && <View style={styles.mainBadge}><Text style={styles.mainBadgeText}>Principal</Text></View>}
                      <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
                        <Text style={styles.removeBtnText}>×</Text>
                      </TouchableOpacity>
                      {img !== mainImage && (
                        <TouchableOpacity style={styles.setMainBtn} onPress={() => setAsMain(img)}>
                          <Text style={styles.setMainBtnText}>Principal</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </ScrollView>
              )}
              <View style={styles.imageButtons}>
                <TouchableOpacity style={styles.imageBtn} onPress={takeMultiplePhotos} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator color="#6C5CE7" /> : <Text style={styles.imageBtnText}>📷 Tomar fotos</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageBtn} onPress={pickMultipleImages} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator color="#6C5CE7" /> : <Text style={styles.imageBtnText}>🖼️ Galeria</Text>}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>{isEditing ? 'Actualizar' : 'Crear Producto'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DFE6E9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DFE6E9',
  },
  chipSelected: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  chipText: {
    fontSize: 13,
    color: '#636E72',
  },
  chipTextSelected: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  imagesSection: {
    marginTop: 8,
  },
  imageList: {
    marginBottom: 12,
  },
  imageItem: {
    marginRight: 12,
    position: 'relative',
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  mainBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: '#6C5CE7',
    borderRadius: 4,
    paddingVertical: 2,
    alignItems: 'center',
  },
  mainBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  removeBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E17055',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  setMainBtn: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    paddingVertical: 2,
    alignItems: 'center',
  },
  setMainBtnText: {
    color: '#fff',
    fontSize: 10,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  imageBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6C5CE7',
    borderStyle: 'dashed',
  },
  imageBtnText: {
    color: '#6C5CE7',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#6C5CE7',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
