import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { api } from '../services/api';
import { Figure } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';

type Filter = 'all' | 'active' | 'inactive' | 'no_price' | 'low_stock';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'active', label: 'Activas' },
  { key: 'inactive', label: 'Inactivas' },
  { key: 'no_price', label: 'Sin precio' },
  { key: 'low_stock', label: 'Stock bajo' },
];

const PAGE_SIZE = 30;

function filterParams(filter: Filter) {
  switch (filter) {
    case 'active':
      return { active: true };
    case 'inactive':
      return { active: false };
    case 'no_price':
      return { no_price: true };
    case 'low_stock':
      return { low_stock: true };
    default:
      return {};
  }
}

export function FiguresScreen({ navigation, route }: any) {
  const [figures, setFigures] = useState<Figure[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const requestId = useRef(0);

  // El tablero puede abrir esta pantalla con un filtro (p. ej. "Sin precio").
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const requested = route?.params?.filter as Filter | undefined;
      if (requested) {
        setFilter(requested);
        navigation.setParams({ filter: undefined });
      } else {
        load(1, true);
      }
    });
    return unsubscribe;
  }, [navigation, route?.params?.filter, debouncedQuery, filter]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    setIsLoading(true);
    load(1, true);
  }, [debouncedQuery, filter]);

  const load = useCallback(
    async (nextPage: number, replace: boolean) => {
      const id = ++requestId.current;
      try {
        const response = await api.getFigures({
          page: nextPage,
          per_page: PAGE_SIZE,
          search: debouncedQuery || undefined,
          ...filterParams(filter),
        });
        if (id !== requestId.current) return; // llegó una respuesta más nueva
        setFigures((prev) => (replace ? response.data : [...prev, ...response.data]));
        setTotal(response.total);
        setPage(response.current_page);
        setLastPage(response.last_page);
      } catch {
        if (id === requestId.current) Alert.alert('Error', 'No se pudieron cargar las figuras');
      } finally {
        if (id === requestId.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [debouncedQuery, filter]
  );

  const handleRefresh = () => {
    setRefreshing(true);
    load(1, true);
  };

  const handleEndReached = () => {
    if (isLoadingMore || isLoading || page >= lastPage) return;
    setIsLoadingMore(true);
    load(page + 1, false);
  };

  const handleDelete = (figure: Figure) => {
    Alert.alert('Eliminar Figura', `Estas seguro de eliminar "${figure.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteFigure(figure.id);
            load(1, true);
          } catch {
            Alert.alert('Error', 'No se pudo eliminar la figura');
          }
        },
      },
    ]);
  };

  const renderFigure = ({ item }: { item: Figure }) => {
    const price = parseFloat(item.price);
    return (
      <TouchableOpacity
        style={[styles.productCard, !item.is_active && styles.inactiveCard]}
        onPress={() => navigation.navigate('FigureForm', { figure: item })}
        onLongPress={() => handleDelete(item)}
      >
        <View style={styles.imageContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.productImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text>🎭</Text>
            </View>
          )}
          {!item.is_active && (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.badgeText}>Inactiva</Text>
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
          <Text style={styles.productSku}>{item.sku}{item.category ? ` · ${item.category.name}` : ''}</Text>
          <View style={styles.priceStock}>
            <Text style={[styles.productPrice, price <= 0 && styles.noPrice]}>
              {price > 0 ? `$${price.toFixed(2)}` : 'Sin precio'}
            </Text>
            <Text style={[styles.productStock, item.stock <= item.min_stock && styles.lowStock]}>
              Stock: {item.stock}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBg} />
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Figuras{total ? ` (${total})` : ''}</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o SKU..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.placeholder}
            autoCorrect={false}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
                onPress={() => setFilter(f.key)}
              >
                <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={figures}
            renderItem={renderFigure}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
            }
            ListFooterComponent={isLoadingMore ? <ActivityIndicator style={styles.footer} color={colors.primary} /> : null}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🎭</Text>
                <Text style={styles.emptyText}>
                  {debouncedQuery || filter !== 'all' ? 'No se encontraron figuras' : 'No hay figuras'}
                </Text>
              </View>
            }
          />
        )}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('FigureForm', { figure: null })}
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
    backgroundColor: colors.background,
    position: 'relative',
  },
  safeArea: {
    flex: 1,
  },
  filters: {
    marginTop: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#fff',
  },
  filterText: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: '#fff',
  },
  filterTextActive: {
    color: colors.primary,
  },
  inactiveCard: {
    opacity: 0.7,
  },
  noPrice: {
    color: colors.danger,
    fontSize: 12,
  },
  footer: {
    marginVertical: 16,
  },
  headerBg: {
    height: 100,
    backgroundColor: colors.primary,
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
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: fonts.display,
    color: '#fff',
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.ink,
  },
  listContent: {
    padding: 8,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    margin: 4,
    overflow: 'hidden',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  imageContainer: {
    height: 110,
    backgroundColor: colors.border,
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
    backgroundColor: colors.danger,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  featuredBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.warning,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: fonts.semibold,
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.ink,
  },
  productSku: {
    fontSize: 10,
    color: colors.muted,
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
    fontFamily: fonts.display,
    color: colors.primary,
  },
  productStock: {
    fontSize: 11,
    color: colors.success,
  },
  lowStock: {
    color: colors.danger,
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
    color: colors.muted,
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
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    fontFamily: fonts.regular,
  },
});
