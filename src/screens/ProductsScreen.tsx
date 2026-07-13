import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { Funkomaceta } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Skeleton, SkeletonCard } from '../components/Skeleton';

export function ProductsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [products, setProducts] = useState<Funkomaceta[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Funkomaceta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cardWidth, setCardWidth] = useState(180);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchProducts);
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredProducts(
        products.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.sku.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    try {
      const response = await api.getProducts();
      setProducts(response.data || []);
      setFilteredProducts(response.data || []);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleDelete = (product: Funkomaceta) => {
    Alert.alert(
      'Eliminar Producto',
      `Estas seguro de eliminar "${product.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteProduct(product.id);
              fetchProducts();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          },
        },
      ]
    );
  };

  const renderProduct = ({ item }: { item: Funkomaceta }) => {
    const allImages = [item.image, ...(item.images ?? [])].filter(Boolean) as string[];

    return (
      <View style={[styles.productCard, !item.is_active && styles.productCardInactive]}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ProductForm', { product: item })}
        >
          <View
            style={styles.imageContainer}
            onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}
          >
            {allImages.length > 0 ? (
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.imageScroll}
              >
                {allImages.map((uri, index) => (
                  <Image
                    key={`${item.id}-${index}`}
                    source={{ uri }}
                    style={[styles.productImage, { width: cardWidth }]}
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="cube-outline" size={32} color="#B2BEC3" />
              </View>
            )}
            {allImages.length > 1 && (
              <View style={styles.imageCounter}>
                <Ionicons name="camera" size={11} color="#fff" />
                <Text style={styles.imageCounterText}>{allImages.length}</Text>
              </View>
            )}
            {item.stock === 0 && (
              <View style={styles.outOfStockBadge}>
                <Text style={styles.badgeText}>Sin Stock</Text>
              </View>
            )}
            {item.is_featured && (
              <View style={styles.featuredBadge}>
                <Ionicons name="star" size={14} color="#fff" />
              </View>
            )}
            {!item.is_active && (
              <View style={styles.hiddenOverlay}>
                <Ionicons name="eye-off" size={18} color="#fff" />
                <Text style={styles.hiddenOverlayText}>OCULTO</Text>
              </View>
            )}
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.productSku}>{item.sku}</Text>
            <View style={styles.priceStock}>
              <Text style={styles.productPrice}>${parseFloat(item.price).toFixed(2)}</Text>
              <Text style={[styles.productStock, item.stock <= item.min_stock && styles.lowStock]}>
                Stock: {item.stock}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        <View style={styles.productActions}>
          <TouchableOpacity
            style={[styles.productActionBtn, item.is_active ? styles.btnVisible : styles.btnHidden]}
            onPress={async () => {
              try {
                await api.toggleProductActive(item.id);
                fetchProducts();
              } catch {
                Alert.alert('Error', 'No se pudo cambiar la visibilidad');
              }
            }}
          >
            <Ionicons
              name={item.is_active ? 'eye-outline' : 'eye-off-outline'}
              size={16}
              color="#fff"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.productActionBtn, styles.btnDelete]}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash-outline" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerBg, { backgroundColor: colors.headerBg }]} />
        <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
          <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
            <Skeleton width={150} height={22} style={{ marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.3)' }} />
            <Skeleton width="100%" height={42} borderRadius={10} style={{ backgroundColor: 'rgba(255,255,255,0.85)' }} />
          </View>
          <View style={styles.listContent}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <SkeletonCard />
              </View>
              <View style={{ flex: 1 }}>
                <SkeletonCard />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <View style={{ flex: 1 }}>
                <SkeletonCard />
              </View>
              <View style={{ flex: 1 }}>
                <SkeletonCard />
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBg, { backgroundColor: colors.headerBg }]} />
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
          <Text style={[styles.headerTitle, { color: '#fff' }]}>Productos</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar producto..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#6C5CE7']} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="archive-outline" size={64} color="#DFE6E9" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No se encontraron productos' : 'No hay productos'}
            </Text>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ProductForm', { product: null })}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  safeArea: {
    flex: 1,
  },
  headerBg: {
    height: 100,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#2D3436',
  },
  listContent: {
    padding: 8,
  },
  productCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    margin: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productCardInactive: {
    opacity: 0.7,
  },
  imageContainer: {
    height: 110,
    backgroundColor: '#DFE6E9',
    position: 'relative',
  },
  hiddenOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hiddenOverlayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    backgroundColor: 'rgba(225,112,85,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
  },
  productActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productActionIcon: {
    fontSize: 14,
  },
  btnVisible: {
    backgroundColor: '#00B894',
  },
  btnHidden: {
    backgroundColor: '#636E72',
  },
  btnDelete: {
    backgroundColor: '#E17055',
  },
  imageScroll: {
    flex: 1,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#E17055',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  featuredBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FDCB6E',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  productSku: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  priceStock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  productStock: {
    fontSize: 11,
    color: colors.success,
  },
  lowStock: {
    color: '#E17055',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
});
