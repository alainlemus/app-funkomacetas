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
import * as ImageManipulator from 'expo-image-manipulator';
import { api } from '../services/api';
import { getErrorMessage } from '../lib/errors';
import { Category } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';

// Lado mayor máximo, igual que el servidor (que además convierte a WebP).
const MAX_IMAGE_SIDE = 1200;

async function compressImage(uri: string, width?: number, height?: number): Promise<string> {
  const longest = Math.max(width ?? 0, height ?? 0);
  const actions =
    longest > MAX_IMAGE_SIDE
      ? [{ resize: (height ?? 0) > (width ?? 0) ? { height: MAX_IMAGE_SIDE } : { width: MAX_IMAGE_SIDE } }]
      : [];
  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: 0.7,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return result.uri;
}

export function FigureFormScreen({ navigation, route }: any) {
  const figure = route.params?.figure;
  const isEditing = !!figure;

  const [name, setName] = useState(figure?.name || '');
  const [sku, setSku] = useState(figure?.sku || '');
  const [price, setPrice] = useState(figure?.price ? String(figure.price) : '');
  const [stock, setStock] = useState(figure?.stock ? String(figure.stock) : '0');
  const [cost, setCost] = useState(figure?.cost ? String(figure.cost) : '');
  const [minStock, setMinStock] = useState(figure?.min_stock ? String(figure.min_stock) : '5');
  const [description, setDescription] = useState(figure?.description || '');
  const [categoryId, setCategoryId] = useState<number | null>(figure?.category_id || null);
  const [isFeatured, setIsFeatured] = useState(figure?.is_featured || false);
  const [isActive, setIsActive] = useState(figure?.is_active ?? true);
  // La foto principal viene aparte en `image`; en la lista de fotos se muestra junto con las demás.
  const [images, setImages] = useState<string[]>(
    Array.from(new Set([figure?.image, ...(figure?.images || [])].filter(Boolean) as string[]))
  );
  const [mainImage, setMainImage] = useState<string>(figure?.image || '');

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setCategories(await api.getCategories());
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
      const asset = result.assets[0];
      setIsLoading(true);
      try {
        const compressedUri = await compressImage(asset.uri, asset.width, asset.height);
        const url = await api.uploadImage(compressedUri);
        if (images.length === 0 && !mainImage) {
          setMainImage(url);
        }
        setImages([...images, url]);
      } catch (error: any) {
        Alert.alert('Error', getErrorMessage(error, 'No se pudo subir la imagen'));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitas dar permiso a la camara para tomar fotos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setIsLoading(true);
      try {
        const compressedUri = await compressImage(asset.uri, asset.width, asset.height);
        const url = await api.uploadImage(compressedUri);
        if (!mainImage) {
          setMainImage(url);
        }
        setImages([...images, url]);
      } catch (error: any) {
        Alert.alert('Error', getErrorMessage(error, 'No se pudo subir la imagen'));
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
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setIsLoading(true);
      try {
        const compressedUris = await Promise.all(
          result.assets.map((a) => compressImage(a.uri, a.width, a.height))
        );
        const urls = await api.uploadImages(compressedUris);
        setImages([...images, ...urls]);
        if (!mainImage && urls.length > 0) {
          setMainImage(urls[0]);
        }
      } catch (error: any) {
        Alert.alert('Error', getErrorMessage(error, 'No se pudieron subir las imagenes'));
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
    if (isActive && (!price || parseFloat(price) <= 0)) {
      Alert.alert('Error', 'Para activar la figura el precio debe ser mayor a 0');
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        name: name.trim(),
        sku: sku.trim(),
        price: parseFloat(price) || 0,
        stock: parseInt(stock) || 0,
        cost: cost ? parseFloat(cost) : undefined,
        min_stock: parseInt(minStock) || 5,
        description: description.trim() || undefined,
        category_id: categoryId || undefined,
        is_featured: isFeatured,
        is_active: isActive,
        image: mainImage || (isEditing ? null : undefined),
        images: isEditing || images.length > 0 ? images : undefined,
      };

      if (isEditing) {
        await api.updateFigure(figure.id, data);
      } else {
        await api.createFigure(data);
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', getErrorMessage(error, 'No se pudo guardar'));
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
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nombre de la figura" />

            <Text style={styles.label}>SKU *</Text>
            <TextInput style={styles.input} value={sku} onChangeText={setSku} placeholder="SKU-001" autoCapitalize="characters" />

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Precio{isActive ? ' *' : ''}</Text>
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
              placeholder="Descripcion de la figura"
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

            <View style={styles.switchRow}>
              <Text style={styles.label}>Figura Destacada</Text>
              <Switch value={isFeatured} onValueChange={setIsFeatured} trackColor={{ false: colors.border, true: colors.primaryLight }} />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.label}>Activo</Text>
              <Switch value={isActive} onValueChange={setIsActive} trackColor={{ false: colors.border, true: colors.primaryLight }} />
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
                          <Text style={styles.setMainBtnText}>Hacer principal</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </ScrollView>
              )}
              <View style={styles.imageButtons}>
                <TouchableOpacity style={styles.imageBtn} onPress={takePhoto} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.imageBtnText}>📷 Tomar foto</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageBtn} onPress={pickMultipleImages} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.imageBtnText}>🖼️ Galeria</Text>}
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
                <Text style={styles.saveBtnText}>{isEditing ? 'Actualizar' : 'Crear Figura'}</Text>
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
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.ink,
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
    borderColor: colors.border,
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
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.muted,
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
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingVertical: 2,
    alignItems: 'center',
  },
  mainBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: fonts.semibold,
  },
  removeBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.bold,
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
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  imageBtnText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
  },
  saveBtn: {
    backgroundColor: colors.primary,
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
    fontFamily: fonts.semibold,
  },
});
