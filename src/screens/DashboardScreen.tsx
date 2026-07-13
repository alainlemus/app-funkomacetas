import React, { useState, useEffect, useRef } from 'react';
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
  Modal,
  TextInput,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { Skeleton, SkeletonStatCard, SkeletonTableRow } from '../components/Skeleton';
import { ThemeToggle } from '../components/ThemeToggle';
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

interface StockItem {
  id: number;
  name: string;
  sku: string;
  stock: number;
  min_stock: number;
  price: string;
  image: string | null;
  images: string[] | null;
}

export function DashboardScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const { colors, isDark } = useTheme();
  const [stats, setStats] = useState<Stats | null>(null);
  const [lowStockItems, setLowStockItems] = useState<StockItem[]>([]);
  const [outOfStockItems, setOutOfStockItems] = useState<StockItem[]>([]);
  const [topSelling, setTopSelling] = useState<StockItem[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string; count: number; is_active: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sellModal, setSellModal] = useState<{ item: StockItem; quantity: string } | null>(null);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const toStockItem = (p: Funkomaceta): StockItem => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    stock: p.stock,
    min_stock: p.min_stock,
    price: p.price,
    image: p.image,
    images: p.images,
  });

  const fetchData = async () => {
    try {
      const [products, categoriesData, topSellers] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getTopSelling(5),
      ]);

      const allProducts = products.data as Funkomaceta[];
      const lowStock = allProducts.filter((p) => p.stock <= p.min_stock && p.stock > 0);
      const outOfStock = allProducts.filter((p) => p.stock === 0);
      const totalValue = allProducts.reduce((sum, p) => sum + (parseFloat(p.price) * p.stock), 0);

      setLowStockItems(lowStock.map(toStockItem));
      setOutOfStockItems(outOfStock.map(toStockItem));
      setTopSelling((topSellers as Funkomaceta[]).map(toStockItem));
      setCategories(
        (categoriesData as any[]).map((c) => ({
          id: c.id,
          name: c.name,
          count: c.funkomacetas_count || 0,
          is_active: c.is_active,
        }))
      );

      setStats({
        totalProducts: products.total,
        lowStock: lowStock.length,
        outOfStock: outOfStock.length,
        totalCategories: categoriesData.length,
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

  interface StockTableProps {
  title: string;
  subtitle: string;
  iconName: keyof typeof Ionicons.glyphMap;
  items: StockItem[];
  theme: 'warning' | 'danger';
  navigation: any;
  onRefresh: () => void;
  showAddStock: boolean;
}

function StatCardAnimated({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay: index * 70, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay: index * 70, useNativeDriver: true }),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

function StockTable({ title, subtitle, iconName, items, theme, navigation, onRefresh, showAddStock }: StockTableProps) {
  const [expanded, setExpanded] = useState(false);
  const VISIBLE_COUNT = 5;

  if (items.length === 0) return null;

  const accentColor = theme === 'danger' ? '#E17055' : '#FDCB6E';
  const accentTextColor = theme === 'danger' ? '#E17055' : '#B7791F';
  const visibleItems = expanded ? items : items.slice(0, VISIBLE_COUNT);
  const hasMore = items.length > VISIBLE_COUNT;

  return (
    <View style={styles.section}>
      <View style={styles.tableHeader}>
        <View style={styles.tableTitleWrap}>
          <View style={[styles.tableTitleIcon, { backgroundColor: accentColor + '20' }]}>
            <Ionicons name={iconName} size={20} color={accentTextColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: accentTextColor }]}>{title}</Text>
            <Text style={styles.tableSubtitle}>{subtitle} · {items.length} producto{items.length === 1 ? '' : 's'}</Text>
          </View>
        </View>
        {hasMore && (
          <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.expandBtn}>
            <Text style={styles.expandBtnText}>{expanded ? 'Ver menos' : `Ver todos (${items.length})`}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.tableCard, { borderTopColor: accentColor }]}>
        <View style={styles.tableRowHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Producto</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right' }]}>Stock</Text>
          <Text style={[styles.tableHeaderCell, { flex: 0.7, textAlign: 'right' }]}>Acción</Text>
        </View>

        {visibleItems.map((item, index) => {
          const allImages = [item.image, ...(item.images ?? [])].filter(Boolean) as string[];
          const isLast = index === visibleItems.length - 1;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.tableRow, !isLast && styles.tableRowBorder]}
              onPress={() => navigation.navigate('ProductForm', { product: item })}
            >
              <View style={styles.tableCellProduct}>
                <View style={styles.tableThumb}>
                    {allImages.length > 0 ? (
                      <Image source={{ uri: allImages[0] }} style={styles.tableThumbImage} />
                    ) : (
                      <View style={styles.tableThumbPlaceholder}>
                        <Ionicons name="cube-outline" size={20} color="#B2BEC3" />
                      </View>
                    )}
                </View>
                <View style={styles.tableProductInfo}>
                  <Text style={styles.tableProductName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.tableProductSku} numberOfLines={1}>{item.sku}</Text>
                </View>
              </View>

              <View style={styles.tableCellStock}>
                <Text style={[styles.tableStockValue, theme === 'danger' && styles.tableStockDanger]}>
                  {item.stock}
                </Text>
                {showAddStock && (
                  <Text style={styles.tableStockMeta}>/ min {item.min_stock}</Text>
                )}
              </View>

              <View style={styles.tableCellAction}>
                {showAddStock ? (
                  <TouchableOpacity
                    style={styles.tableAddBtn}
                    onPress={async (e) => {
                      e.stopPropagation?.();
                      try {
                        await api.updateStock(item.id, item.min_stock + 10);
                        onRefresh();
                      } catch {
                        Alert.alert('Error', 'No se pudo actualizar el stock');
                      }
                    }}
                  >
                    <Text style={styles.tableAddBtnText}>+10</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.tableAddBtn, { backgroundColor: accentColor }]}
                    onPress={async (e) => {
                      e.stopPropagation?.();
                      try {
                        await api.updateStock(item.id, 10);
                        onRefresh();
                      } catch {
                        Alert.alert('Error', 'No se pudo actualizar el stock');
                      }
                    }}
                  >
                    <Text style={styles.tableAddBtnText}>Reponer</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerBg, { backgroundColor: colors.headerBg }]} />
        <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
          <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
            <View>
              <Skeleton width={150} height={18} style={{ marginBottom: 6, backgroundColor: 'rgba(255,255,255,0.3)' }} />
              <Skeleton width={100} height={12} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
            </View>
            <Skeleton width={70} height={28} borderRadius={8} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
          </View>

          <ScrollView style={styles.scrollContent}>
            <View style={styles.statsGrid}>
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
            </View>

            <View style={[styles.valueCard, { backgroundColor: colors.surface }]}>
              <Skeleton width={28} height={28} borderRadius={14} style={{ marginBottom: 6 }} />
              <Skeleton width="60%" height={12} style={{ marginBottom: 6 }} />
              <Skeleton width="40%" height={28} />
            </View>

            <View style={styles.section}>
              <Skeleton width="60%" height={14} style={{ marginBottom: 10 }} />
              <View style={[styles.tableCard, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                <SkeletonTableRow />
                <SkeletonTableRow />
                <SkeletonTableRow />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBg, { backgroundColor: colors.headerBg }]} />
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
          <View>
            <Text style={styles.greeting}>Hola, {user?.name}</Text>
            <Text style={styles.subtitle}>Panel de Administracion</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <ThemeToggle />
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Salir</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#6C5CE7']} />
          }
        >
          <View style={styles.statsGrid}>
            <StatCardAnimated index={0}>
              <TouchableOpacity
                style={[styles.statCard, styles.primaryCard]}
                onPress={() => navigation.navigate('Productos')}
              >
                <View style={styles.statIconWrap}>
                  <Ionicons name="archive-outline" size={26} color="#fff" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{stats?.totalProducts || 0}</Text>
                  <Text style={styles.statLabel}>Productos</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" style={styles.statChevron} />
              </TouchableOpacity>
            </StatCardAnimated>

            <StatCardAnimated index={1}>
              <TouchableOpacity
                style={[styles.statCard, styles.warningCard]}
                onPress={() => navigation.navigate('Productos')}
              >
                <View style={styles.statIconWrap}>
                  <Ionicons name="warning-outline" size={26} color="#fff" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{stats?.lowStock || 0}</Text>
                  <Text style={styles.statLabel}>Stock Bajo</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" style={styles.statChevron} />
              </TouchableOpacity>
            </StatCardAnimated>

            <StatCardAnimated index={2}>
              <TouchableOpacity
                style={[styles.statCard, styles.dangerCard]}
                onPress={() => navigation.navigate('Productos')}
              >
                <View style={styles.statIconWrap}>
                  <Ionicons name="close-circle-outline" size={26} color="#fff" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{stats?.outOfStock || 0}</Text>
                  <Text style={styles.statLabel}>Sin Stock</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" style={styles.statChevron} />
              </TouchableOpacity>
            </StatCardAnimated>

            <StatCardAnimated index={3}>
              <TouchableOpacity
                style={[styles.statCard, styles.secondaryCard]}
                onPress={() => navigation.navigate('Categorias')}
              >
                <View style={styles.statIconWrap}>
                  <Ionicons name="pricetag-outline" size={26} color="#fff" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{stats?.totalCategories || 0}</Text>
                  <Text style={styles.statLabel}>Categorias</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" style={styles.statChevron} />
              </TouchableOpacity>
            </StatCardAnimated>
          </View>

        <View style={[styles.valueCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="cash-outline" size={28} color={colors.success} style={{ marginBottom: 6 }} />
          <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>Valor del Inventario</Text>
          <Text style={[styles.valueAmount, { color: colors.primary }]}>
            ${(stats?.totalValue || 0).toFixed(2)}
          </Text>
        </View>

        <StockTable
          title="Productos Sin Stock"
          subtitle="Reposicion urgente"
          iconName="close-circle"
          items={outOfStockItems}
          theme="danger"
          navigation={navigation}
          onRefresh={fetchData}
          showAddStock={false}
        />

        <StockTable
          title="Productos con Stock Bajo"
          subtitle="Pronto se agotaran"
          iconName="warning"
          items={lowStockItems}
          theme="warning"
          navigation={navigation}
          onRefresh={fetchData}
          showAddStock={true}
        />

        {topSelling.length > 0 && (
          <View style={styles.section}>
            <View style={styles.tableHeader}>
              <View style={styles.tableTitleWrap}>
                <View style={[styles.tableTitleIcon, { backgroundColor: '#6C5CE720' }]}>
                  <Ionicons name="trophy" size={20} color="#6C5CE7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, { color: '#6C5CE7' }]}>Más Vendidos</Text>
                  <Text style={styles.tableSubtitle}>Top {topSelling.length} por ventas</Text>
                </View>
              </View>
            </View>

            <View style={[styles.tableCard, { borderTopColor: '#6C5CE7' }]}>
              <View style={styles.tableRowHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>#</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Producto</Text>
                <Text style={[styles.tableHeaderCell, { flex: 0.8, textAlign: 'right' }]}>Vendidos</Text>
                <Text style={[styles.tableHeaderCell, { flex: 0.7, textAlign: 'right' }]}>Vender</Text>
              </View>

              {topSelling.map((item, index) => {
                const allImages = [item.image, ...(item.images ?? [])].filter(Boolean) as string[];
                const isLast = index === topSelling.length - 1;
                const isTop3 = index < 3;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.tableRow, !isLast && styles.tableRowBorder]}
                    onPress={() => navigation.navigate('ProductForm', { product: item })}
                  >
                    <View style={[styles.tableCellProduct, { flex: 0.5 }]}>
                      {isTop3 ? (
                        <View style={[styles.medalCircle, index === 0 && styles.medalGold, index === 1 && styles.medalSilver, index === 2 && styles.medalBronze]}>
                          <Ionicons name="trophy" size={16} color="#fff" />
                        </View>
                      ) : (
                        <Text style={styles.medalText}>{index + 1}</Text>
                      )}
                    </View>
                    <View style={[styles.tableCellProduct, { flex: 2 }]}>
                      <View style={styles.tableThumb}>
                        {allImages.length > 0 ? (
                          <Image source={{ uri: allImages[0] }} style={styles.tableThumbImage} />
                        ) : (
                          <View style={styles.tableThumbPlaceholder}>
                            <Ionicons name="cube-outline" size={20} color="#B2BEC3" />
                          </View>
                        )}
                      </View>
                      <View style={styles.tableProductInfo}>
                        <Text style={styles.tableProductName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.tableProductSku} numberOfLines={1}>${parseFloat(item.price).toFixed(2)}</Text>
                      </View>
                    </View>
                    <View style={[styles.tableCellStock, { flex: 0.8 }]}>
                      <Text style={styles.topSellingCount}>{item.sales_count}</Text>
                      <Text style={styles.tableStockMeta}>unidades</Text>
                    </View>
                    <View style={[styles.tableCellAction, { flex: 0.7 }]}>
                      <TouchableOpacity
                        style={styles.sellBtn}
                        onPress={async (e) => {
                          e.stopPropagation?.();
                          try {
                            await api.recordSale(item.id, 1);
                            fetchData();
                          } catch {
                            Alert.alert('Error', 'No se pudo registrar la venta');
                          }
                        }}
                        onLongPress={(e) => {
                          e.stopPropagation?.();
                          setSellModal({ item, quantity: '1' });
                        }}
                      >
                        <Text style={styles.sellBtnText}>+1</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {categories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.tableHeader}>
              <View style={styles.tableTitleWrap}>
                <View style={[styles.tableTitleIcon, { backgroundColor: '#00CEC920' }]}>
                  <Ionicons name="pricetags" size={20} color="#00CEC9" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, { color: '#00CEC9' }]}>Categorías</Text>
                  <Text style={styles.tableSubtitle}>{categories.length} categorías · distribución de productos</Text>
                </View>
              </View>
            </View>

            <View style={[styles.tableCard, { borderTopColor: '#00CEC9' }]}>
              <View style={styles.tableRowHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Categoría</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Productos</Text>
                <Text style={[styles.tableHeaderCell, { flex: 0.5, textAlign: 'center' }]}>Estado</Text>
              </View>

              {categories.map((cat, index) => {
                const isLast = index === categories.length - 1;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.tableRow, !isLast && styles.tableRowBorder]}
                    onPress={() => navigation.navigate('Categorias')}
                  >
                    <View style={[styles.tableCellProduct, { flex: 3 }]}>
                      <View style={styles.categoryIcon}>
                        <Ionicons name="pricetag" size={18} color="#00CEC9" />
                      </View>
                      <Text style={styles.tableProductName} numberOfLines={1}>{cat.name}</Text>
                    </View>
                    <View style={[styles.tableCellStock, { flex: 1 }]}>
                      <Text style={styles.categoryCount}>{cat.count}</Text>
                    </View>
                    <View style={[styles.tableCellAction, { flex: 0.5 }]}>
                      <View style={[styles.statusDot, cat.is_active ? styles.statusDotActive : styles.statusDotInactive]} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Acciones Rapidas</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Productos')}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#F0EDFF' }]}>
                <Ionicons name="archive-outline" size={26} color="#6C5CE7" />
              </View>
              <Text style={styles.actionText}>Productos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Categorias')}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#E0F7FA' }]}>
                <Ionicons name="pricetag-outline" size={26} color="#00CEC9" />
              </View>
              <Text style={styles.actionText}>Categorias</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Figuras')}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="happy-outline" size={26} color="#FDCB6E" />
              </View>
              <Text style={styles.actionText}>Figuras</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal visible={!!sellModal} animationType="fade" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setSellModal(null)}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.modalHeader}>
              <Ionicons name="cash-outline" size={28} color={colors.success} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>Registrar venta</Text>
            </View>
            {sellModal && (
              <Text style={[styles.modalProductName, { color: colors.textSecondary }]} numberOfLines={1}>
                {sellModal.item.name}
              </Text>
            )}

            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Cantidad</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              value={sellModal?.quantity ?? ''}
              onChangeText={(text) => setSellModal((prev) => prev ? { ...prev, quantity: text.replace(/[^0-9]/g, '') } : null)}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor={colors.textMuted}
              autoFocus
              selectTextOnFocus
            />

            <View style={styles.modalQuickRow}>
              {[1, 5, 10, 25, 50].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.modalQuickBtn, { backgroundColor: colors.surfaceAlt }]}
                  onPress={() => setSellModal((prev) => prev ? { ...prev, quantity: String(n) } : null)}
                >
                  <Text style={[styles.modalQuickBtnText, { color: colors.primary }]}>+{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancel, { backgroundColor: colors.surfaceAlt }]}
                onPress={() => setSellModal(null)}
                disabled={isSubmittingSale}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirm, { backgroundColor: colors.success }, isSubmittingSale && styles.modalConfirmDisabled]}
                onPress={async () => {
                  if (!sellModal) return;
                  const qty = parseInt(sellModal.quantity, 10);
                  if (!qty || qty < 1) {
                    Alert.alert('Error', 'Ingresa una cantidad valida');
                    return;
                  }
                  setIsSubmittingSale(true);
                  try {
                    await api.recordSale(sellModal.item.id, qty);
                    setSellModal(null);
                    fetchData();
                  } catch {
                    Alert.alert('Error', 'No se pudo registrar la venta');
                  } finally {
                    setIsSubmittingSale(false);
                  }
                }}
                disabled={isSubmittingSale}
              >
                {isSubmittingSale ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Registrar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tableRowHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: '700',
    color: '#636E72',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  tableCellProduct: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tableThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#DFE6E9',
  },
  tableThumbImage: {
    width: '100%',
    height: '100%',
  },
  tableThumbPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableProductInfo: {
    flex: 1,
  },
  tableProductName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D3436',
  },
  tableProductSku: {
    fontSize: 10,
    color: '#95A5A6',
    marginTop: 1,
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
    flexDirection: 'column',
    padding: 12,
    gap: 10,
  },
  statCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    paddingVertical: 18,
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
  statIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
    marginLeft: 14,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 32,
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
    fontWeight: '500',
  },
  statChevron: {
    marginLeft: 8,
    opacity: 0.7,
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
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tableTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  tableTitleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableSubtitle: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 2,
  },
  expandBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F3F5',
  },
  expandBtnText: {
    fontSize: 12,
    color: '#6C5CE7',
    fontWeight: '600',
  },
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tableRowHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: '700',
    color: '#636E72',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  tableCellProduct: {
    flex: 0.8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tableThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#DFE6E9',
  },
  tableThumbImage: {
    width: '100%',
    height: '100%',
  },
  tableThumbPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableProductInfo: {
    flex: 1,
  },
  tableProductName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D3436',
  },
  tableProductSku: {
    fontSize: 10,
    color: '#95A5A6',
    marginTop: 1,
  },
  tableCellStock: {
    flex: 1.2,
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  tableStockValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3436',
  },
  tableStockDanger: {
    color: '#E17055',
  },
  tableStockMeta: {
    fontSize: 10,
    color: '#95A5A6',
    marginTop: 1,
  },
  tableCellAction: {
    flex: 0.7,
    alignItems: 'flex-end',
  },
  tableAddBtn: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tableAddBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  medalText: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
    color: '#636E72',
  },
  medalCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  medalGold: {
    backgroundColor: '#FFD700',
  },
  medalSilver: {
    backgroundColor: '#C0C0C0',
  },
  medalBronze: {
    backgroundColor: '#CD7F32',
  },
  topSellingCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6C5CE7',
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00CEC9',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusDotActive: {
    backgroundColor: '#00B894',
  },
  statusDotInactive: {
    backgroundColor: '#B2BEC3',
  },
  sellBtn: {
    backgroundColor: '#00B894',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 40,
    alignItems: 'center',
  },
  sellBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    paddingTop: 16,
    width: '100%',
    maxWidth: 360,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  modalClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 4,
  },
  modalProductName: {
    fontSize: 13,
    color: '#636E72',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#636E72',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#DFE6E9',
    color: '#2D3436',
    textAlign: 'center',
  },
  modalQuickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  modalQuickBtn: {
    flex: 1,
    backgroundColor: '#F1F3F5',
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 6,
    alignItems: 'center',
  },
  modalQuickBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C5CE7',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancel: {
    backgroundColor: '#F1F3F5',
  },
  modalCancelText: {
    color: '#636E72',
    fontWeight: '600',
  },
  modalConfirm: {
    backgroundColor: '#00B894',
  },
  modalConfirmDisabled: {
    opacity: 0.7,
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '700',
  },
});
