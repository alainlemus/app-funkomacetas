import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Funkomaceta } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Stats {
  totalProducts: number;
  lowStock: number;
  outOfStock: number;
  totalCategories: number;
  totalValue: number;
}

interface LowStockItem {
  id: number;
  name: string;
  stock: number;
  min_stock: number;
  image: string | null;
  images: string[] | null;
}

export function DashboardScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const fetchData = async () => {
    try {
      const [products, categories] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
      ]);

      const allProducts = products.data as Funkomaceta[];
      const lowStock = allProducts.filter((p) => p.stock <= p.min_stock && p.stock > 0);
      const outOfStock = allProducts.filter((p) => p.stock === 0);
      const totalValue = allProducts.reduce((sum, p) => sum + (parseFloat(p.price) * p.stock), 0);

      setLowStockItems(lowStock.slice(0, 5).map(p => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        min_stock: p.min_stock,
        image: p.image,
        images: p.images,
      })));

      setStats({
        totalProducts: products.total,
        lowStock: lowStock.length,
        outOfStock: outOfStock.length,
        totalCategories: categories.length,
        totalValue,
      });
    } catch {
      setStats({
        totalProducts: 0,
        lowStock: 0,
        outOfStock: 0,
        totalCategories: 0,
        totalValue: 0,
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesion',
      'Estas seguro de cerrar sesion?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesion', style: 'destructive', onPress: logout },
      ]
    );
  };

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
          <View>
            <Text style={styles.greeting}>Hola, {user?.name}</Text>
            <Text style={styles.subtitle}>Panel de Administracion</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#6C5CE7']} />
          }
        >
          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={[styles.statCard, styles.primaryCard]}
              onPress={() => navigation.navigate('Productos')}
            >
              <Text style={styles.statIcon}>📦</Text>
              <Text style={styles.statValue}>{stats?.totalProducts || 0}</Text>
              <Text style={styles.statLabel}>Productos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, styles.warningCard]}
              onPress={() => navigation.navigate('Productos')}
            >
              <Text style={styles.statIcon}>⚠️</Text>
            <Text style={styles.statValue}>{stats?.lowStock || 0}</Text>
            <Text style={styles.statLabel}>Stock Bajo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, styles.dangerCard]}
            onPress={() => navigation.navigate('Productos')}
          >
            <Text style={styles.statIcon}>❌</Text>
            <Text style={styles.statValue}>{stats?.outOfStock || 0}</Text>
            <Text style={styles.statLabel}>Sin Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, styles.secondaryCard]}
            onPress={() => navigation.navigate('Categorias')}
          >
            <Text style={styles.statIcon}>🏷️</Text>
            <Text style={styles.statValue}>{stats?.totalCategories || 0}</Text>
            <Text style={styles.statLabel}>Categorias</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.valueCard}>
          <Text style={styles.valueLabel}>Valor del Inventario</Text>
          <Text style={styles.valueAmount}>
            ${(stats?.totalValue || 0).toFixed(2)}
          </Text>
        </View>

        {lowStockItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Productos con Stock Bajo</Text>
            {lowStockItems.map((item) => {
              const allImages = [item.image, ...(item.images ?? [])].filter(Boolean) as string[];
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.lowStockItem}
                  onPress={() => navigation.navigate('ProductForm', { product: item })}
                >
                  <View style={styles.lowStockImage}>
                    {allImages.length > 0 ? (
                      <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                      >
                        {allImages.map((uri, idx) => (
                          <Image
                            key={`${item.id}-${idx}`}
                            source={{ uri }}
                            style={styles.thumbImage}
                          />
                        ))}
                      </ScrollView>
                    ) : (
                      <View style={styles.thumbPlaceholder}>
                        <Text>📦</Text>
                      </View>
                    )}
                    {allImages.length > 1 && (
                      <View style={styles.thumbCounter}>
                        <Text style={styles.thumbCounterText}>{allImages.length}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.lowStockInfo}>
                    <Text style={styles.lowStockName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.lowStockStock}>
                      Stock: {item.stock} / Min: {item.min_stock}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addStockBtn}
                    onPress={async (e) => {
                      e.stopPropagation?.();
                      try {
                        await api.updateStock(item.id, item.min_stock + 10);
                        fetchData();
                      } catch {
                        Alert.alert('Error', 'No se pudo actualizar el stock');
                      }
                    }}
                  >
                    <Text style={styles.addStockText}>+10</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Acciones Rapidas</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Productos')}
            >
              <Text style={styles.actionIcon}>📦</Text>
              <Text style={styles.actionText}>Productos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Categorias')}
            >
              <Text style={styles.actionIcon}>🏷️</Text>
              <Text style={styles.actionText}>Categorias</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Figuras')}
            >
              <Text style={styles.actionIcon}>🎭</Text>
              <Text style={styles.actionText}>Figuras</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#6C5CE7',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  statCard: {
    width: '47%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  primaryCard: {
    backgroundColor: '#6C5CE7',
  },
  warningCard: {
    backgroundColor: '#FDCB6E',
  },
  dangerCard: {
    backgroundColor: '#E17055',
  },
  secondaryCard: {
    backgroundColor: '#00CEC9',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  valueCard: {
    marginHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  valueLabel: {
    fontSize: 14,
    color: '#636E72',
  },
  valueAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6C5CE7',
    marginTop: 4,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 12,
  },
  lowStockItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lowStockImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  thumbImage: {
    width: 50,
    height: 50,
  },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#DFE6E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbCounter: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
  },
  thumbCounterText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  lowStockInfo: {
    flex: 1,
  },
  lowStockName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3436',
  },
  lowStockStock: {
    fontSize: 12,
    color: '#E17055',
    marginTop: 2,
  },
  addStockBtn: {
    backgroundColor: '#00B894',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addStockText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  quickActions: {
    marginTop: 20,
    paddingHorizontal: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2D3436',
  },
  bottomPadding: {
    height: 20,
  },
});
