import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { Figure } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';

export function FiguresScreen({ navigation }: any) {
  const [figures, setFigures] = useState<Figure[]>([]);
  const [filteredFigures, setFilteredFigures] = useState<Figure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFigure, setEditingFigure] = useState<Figure | null>(null);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchFigures);
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredFigures(
        figures.filter(
          (f) =>
            f.name.toLowerCase().includes(query) ||
            f.sku.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredFigures(figures);
    }
  }, [searchQuery, figures]);

  const fetchFigures = async () => {
    try {
      const data = await api.getFigures();
      setFigures(data);
      setFilteredFigures(data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las figuras');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFigures();
  };

  const openModal = (figure?: Figure) => {
    if (figure) {
      setEditingFigure(figure);
      setName(figure.name);
      setSku(figure.sku);
      setDescription(figure.description || '');
      setIsActive(figure.is_active);
    } else {
      setEditingFigure(null);
      setName('');
      setSku('');
      setDescription('');
      setIsActive(true);
    }
    setModalVisible(true);
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

    setIsSaving(true);
    try {
      if (editingFigure) {
        await api.updateFigure(editingFigure.id, {
          name: name.trim(),
          sku: sku.trim(),
          description: description.trim() || undefined,
          is_active: isActive,
        });
      } else {
        await api.createFigure({
          name: name.trim(),
          sku: sku.trim(),
          description: description.trim() || undefined,
          is_active: isActive,
        });
      }
      setModalVisible(false);
      fetchFigures();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (figure: Figure) => {
    Alert.alert(
      'Eliminar Figura',
      `Estas seguro de eliminar "${figure.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteFigure(figure.id);
              fetchFigures();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la figura');
            }
          },
        },
      ]
    );
  };

  const renderFigure = ({ item }: { item: Figure }) => (
    <TouchableOpacity
      style={[styles.card, !item.is_active && styles.cardInactive]}
      onPress={() => openModal(item)}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Ionicons name="happy-outline" size={26} color="#6C5CE7" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardSku}>{item.sku}</Text>
          <Text style={styles.cardDesc} numberOfLines={1}>
            {item.description || 'Sin descripcion'}
          </Text>
          <Text style={styles.cardCount}>
            {item.funkomacetas_count || 0} productos
          </Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, item.is_active ? styles.btnVisible : styles.btnHidden]}
            onPress={async () => {
              try {
                await api.toggleFigureActive(item.id);
                fetchFigures();
              } catch {
                Alert.alert('Error', 'No se pudo cambiar la visibilidad');
              }
            }}
          >
            <Ionicons
              name={item.is_active ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color="#fff"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.btnDelete]}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
          </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Figuras</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar figura..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <FlatList
        data={filteredFigures}
        renderItem={renderFigure}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#6C5CE7']} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="happy-outline" size={64} color="#DFE6E9" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No se encontraron figuras' : 'No hay figuras'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => openModal()}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingFigure ? 'Editar Figura' : 'Nueva Figura'}
            </Text>

            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Nombre de la figura"
            />

            <Text style={styles.label}>SKU</Text>
            <TextInput
              style={styles.input}
              value={sku}
              onChangeText={setSku}
              placeholder="SKU-001"
              autoCapitalize="characters"
            />

            <Text style={styles.label}>Descripcion</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Descripcion (opcional)"
              multiline
              numberOfLines={3}
            />

            <View style={styles.switchRow}>
              <Text style={styles.label}>Activa</Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#DFE6E9', true: '#A29BFE' }}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn, isSaving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Guardar</Text>
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
    padding: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardInactive: {
    opacity: 0.6,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
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
  actionIcon: {
    fontSize: 16,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#DFE6E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
  },
  cardSku: {
    fontSize: 12,
    color: '#6C5CE7',
    fontWeight: '500',
    marginTop: 2,
  },
  cardDesc: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 2,
  },
  cardCount: {
    fontSize: 11,
    color: '#B2BEC3',
    marginTop: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F8F9FA',
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DFE6E9',
  },
  cancelBtnText: {
    color: '#636E72',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#6C5CE7',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
