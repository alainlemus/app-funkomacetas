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
import { FigureStats } from '../types';
import { colors, fonts } from '../theme';

import { SafeAreaView } from 'react-native-safe-area-context';

interface LowStockItem {
  id: number;
  name: string;
  stock: number;
  min_stock: number;
  image: string | null;
}

export function DashboardScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<FigureStats | null>(null);
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
      const data = await api.getFigureStats();
      setStats(data);
      setLowStockItems(
        data.low_stock_items.map((p) => ({
          id: p.id,
          name: p.name,
          stock: p.stock,
          min_stock: p.min_stock,
          image: p.image,
        }))
      );
    } catch {
      setStats(null);
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
        <ActivityIndicator size="large" color={colors.primary} />
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
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
          }
        >
          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={[styles.statCard, styles.primaryCard]}
              onPress={() => navigation.navigate('Figuras', { filter: 'all' })}
            >
              <Text style={styles.statIcon}>🎭</Text>
              <Text style={styles.statValue}>{stats?.total || 0}</Text>
              <Text style={styles.statLabel}>Figuras ({stats?.active || 0} activas)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, styles.warningCard]}
              onPress={() => navigation.navigate('Figuras', { filter: 'low_stock' })}
            >
              <Text style={styles.statIcon}>⚠️</Text>
            <Text style={styles.statValue}>{stats?.low_stock || 0}</Text>
            <Text style={styles.statLabel}>Stock Bajo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, styles.dangerCard]}
            onPress={() => navigation.navigate('Figuras', { filter: 'no_price' })}
          >
            <Text style={styles.statIcon}>💲</Text>
            <Text style={styles.statValue}>{stats?.no_price || 0}</Text>
            <Text style={styles.statLabel}>Sin Precio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, styles.secondaryCard]}
            onPress={() => navigation.navigate('Categorias')}
          >
            <Text style={styles.statIcon}>🏷️</Text>
            <Text style={styles.statValue}>{stats?.categories || 0}</Text>
            <Text style={styles.statLabel}>Categorias</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.valueCard}>
          <Text style={styles.valueLabel}>Valor del Inventario</Text>
          <Text style={styles.valueAmount}>
            ${(stats?.inventory_value || 0).toFixed(2)}
          </Text>
        </View>

        {lowStockItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Figuras con Stock Bajo</Text>
            {lowStockItems.map((item) => (
              <View key={item.id} style={styles.lowStockItem}>
                <View style={styles.lowStockImage}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.thumbImage} />
                  ) : (
                    <View style={styles.thumbPlaceholder}>
                      <Text>📦</Text>
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
                  onPress={async () => {
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
              </View>
            ))}
          </View>
        )}

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Acciones Rapidas</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Figuras', { filter: 'all' })}
            >
              <Text style={styles.actionIcon}>🎭</Text>
              <Text style={styles.actionText}>Figuras</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('FigureForm', { figure: null })}
            >
              <Text style={styles.actionIcon}>➕</Text>
              <Text style={styles.actionText}>Nueva Figura</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Categorias')}
            >
              <Text style={styles.actionIcon}>🏷️</Text>
              <Text style={styles.actionText}>Categorias</Text>
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
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  greeting: {
    fontSize: 20,
    fontFamily: fonts.display,
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
    fontFamily: fonts.semibold,
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
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  primaryCard: {
    backgroundColor: colors.primary,
  },
  warningCard: {
    backgroundColor: colors.warning,
  },
  dangerCard: {
    backgroundColor: colors.danger,
  },
  secondaryCard: {
    backgroundColor: colors.accent,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 24,
    fontFamily: fonts.display,
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
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  valueLabel: {
    fontSize: 14,
    color: colors.muted,
  },
  valueAmount: {
    fontSize: 28,
    fontFamily: fonts.display,
    color: colors.primary,
    marginTop: 4,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.display,
    color: colors.ink,
    marginBottom: 12,
  },
  lowStockItem: {
    backgroundColor: '#fff',
    borderRadius: 20,
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
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lowStockInfo: {
    flex: 1,
  },
  lowStockName: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.ink,
  },
  lowStockStock: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 2,
  },
  addStockBtn: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addStockText: {
    color: '#fff',
    fontFamily: fonts.semibold,
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
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  actionText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.ink,
  },
  bottomPadding: {
    height: 20,
  },
});
