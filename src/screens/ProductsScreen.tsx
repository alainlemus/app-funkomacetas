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
} from 'react-native';
import { api } from '../services/api';
import { Funkomaceta } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';

export function ProductsScreen({ navigation }: any) {
  const [products, setProducts] = useState<Funkomaceta[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Funkomaceta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const renderProduct = ({ item }: { item: Funkomaceta }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductForm', { product: item })}
      onLongPress={() => handleDelete(item)}
    >
      <View style={styles.imageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.productImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text>📦</Text>
          </View>
        )}
        {item.stock === 0 && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.badgeText}>Sin Stock</Text>
          </View>
        )}
        {item.is_featured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.badgeText}>⭐</Text>
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
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C5CE7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBg} />
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Productos</Text>
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
            <Text style={styles.emptyIcon}>📦</Text>
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
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    position: 'relative',
  },
  safeArea: {
    flex: 1,
  },
  headerBg: {
    height: 100,
    backgroundColor: '#6C5CE7',
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
    backgroundColor: '#6C5CE7',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
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
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  imageContainer: {
    height: 110,
    backgroundColor: '#DFE6E9',
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
    color: '#2D3436',
  },
  productSku: {
    fontSize: 10,
    color: '#636E72',
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
    color: '#6C5CE7',
  },
  productStock: {
    fontSize: 11,
    color: '#00B894',
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
    fontSize: 56,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#636E72',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6C5CE7',
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
});
