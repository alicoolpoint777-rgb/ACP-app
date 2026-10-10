import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import api from '../services/api';
import { getServiceImage } from '../utils/imageHelper';

const { width } = Dimensions.get('window');

export default function AdminServicesScreen() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New Service State
  const [newService, setNewService] = useState({
    name: '',
    subtitle: '',
    basePrice: '',
    perTonAddon: '500',
    category: 'ac',
    imageUrl: '',
  });

  const fabScale = useRef(new Animated.Value(1)).current;
  const modalScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/services');
      if (res.data?.success) {
        setServices(res.data.services || []);
      }
    } catch (error) {
      console.log('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setModalVisible(true);
    Animated.spring(modalScale, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(modalScale, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  };

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow access to your photo gallery.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        const dataUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setNewService((prev) => ({ ...prev, imageUrl: dataUri }));
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open photo gallery.');
    }
  };

  const handleFabPressIn = () => Animated.spring(fabScale, { toValue: 0.8, useNativeDriver: true }).start();
  const handleFabPressOut = () => Animated.spring(fabScale, { toValue: 1, friction: 3, useNativeDriver: true }).start();

  const handleSaveService = async () => {
    if (!newService.name?.trim() || !newService.basePrice) {
      Alert.alert('Error', 'Name and Base Price are required');
      return;
    }
    try {
      const res = await api.post('/services', {
        name: newService.name.trim(),
        subtitle: newService.subtitle?.trim() || '',
        basePrice: Number(newService.basePrice),
        perTonAddon: Number(newService.perTonAddon) || 500,
        category: newService.category,
        imageUrl: newService.imageUrl || '',
        requiresAcDetails: newService.category !== 'general',
      });
      if (res.data?.success) {
        closeModal();
        setNewService({ name: '', subtitle: '', basePrice: '', perTonAddon: '500', category: 'ac', imageUrl: '' });
        fetchServices();
      }
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to add service');
    }
  };

  const handleRemoveService = (id) => {
    Alert.alert('Delete Service', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/services/${id}`);
            fetchServices();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete service');
          }
        },
      },
    ]);
  };

  const filteredServices = services.filter((s) => s.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Services</Text>
          <Text style={styles.subtitle}>Manage Service Offerings ({services.length} Total)</Text>
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={fetchServices}>
          <Ionicons name="refresh" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search services..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
        ) : filteredServices.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Ionicons name="build-outline" size={48} color="#CCC" />
            <Text style={{ color: '#888', marginTop: 12 }}>No services found.</Text>
          </View>
        ) : (
          filteredServices.map((service) => (
            <View key={service._id} style={styles.serviceCard}>
              <Image source={getServiceImage(service)} style={styles.serviceThumb} resizeMode="cover" />

              <View style={styles.serviceInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <TouchableOpacity onPress={() => handleRemoveService(service._id)}>
                    <Ionicons name="trash-outline" size={20} color="#FF4757" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.serviceDesc}>{service.subtitle || 'No description'}</Text>

                <View style={styles.bottomRow}>
                  <Text style={styles.servicePrice}>Base: Rs {service.basePrice}</Text>
                </View>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handleFabPressIn}
        onPressOut={handleFabPressOut}
        onPress={openModal}
        style={styles.fabContainer}
      >
        <Animated.View style={[styles.fab, { transform: [{ scale: fabScale }] }]}>
          <Ionicons name="add" size={28} color="#FFF" />
        </Animated.View>
      </TouchableOpacity>

      {/* Add Service Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { transform: [{ scale: modalScale }] }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New AC Service</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 450 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Service Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. AC General Service & Wash"
                  placeholderTextColor="#AAA"
                  value={newService.name}
                  onChangeText={(t) => setNewService({ ...newService, name: t })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description / Subtitle</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Details of what is included in service"
                  placeholderTextColor="#AAA"
                  value={newService.subtitle}
                  onChangeText={(t) => setNewService({ ...newService, subtitle: t })}
                />
              </View>

              {/* Service Image Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Service Banner Image</Text>
                <TouchableOpacity style={styles.galleryPickBtn} onPress={handlePickImage}>
                  <Ionicons name="image-outline" size={20} color={colors.primary} />
                  <Text style={styles.galleryPickText}>
                    {newService.imageUrl ? 'Photo Selected (Tap to Change)' : 'Pick Photo from Phone Gallery'}
                  </Text>
                </TouchableOpacity>
                {newService.imageUrl ? (
                  <Image source={{ uri: newService.imageUrl }} style={styles.previewImage} />
                ) : null}
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.inputLabel}>Base Price (Rs) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="2500"
                    keyboardType="numeric"
                    placeholderTextColor="#AAA"
                    value={newService.basePrice}
                    onChangeText={(t) => setNewService({ ...newService, basePrice: t })}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                  <Text style={styles.inputLabel}>Per-Ton Addon (Rs)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="500"
                    keyboardType="numeric"
                    placeholderTextColor="#AAA"
                    value={newService.perTonAddon}
                    onChangeText={(t) => setNewService({ ...newService, perTonAddon: t })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.categoryRow}>
                  {[{ key: 'ac', label: 'AC' }, { key: 'hvac', label: 'HVAC' }, { key: 'general', label: 'General' }].map(
                    (c) => (
                      <TouchableOpacity
                        key={c.key}
                        style={[styles.categoryChip, newService.category === c.key && styles.categoryChipActive]}
                        onPress={() => setNewService({ ...newService, category: c.key })}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            newService.category === c.key && styles.categoryChipTextActive,
                          ]}
                        >
                          {c.label}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveService}>
                <Text style={styles.saveBtnText}>Save Service</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 15,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 3,
  },
  serviceThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  serviceInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
  },
  serviceDesc: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 25,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  inputGroup: {
    marginBottom: 15,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputLabel: {
    fontSize: 13,
    color: '#555',
    marginBottom: 5,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  galleryPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCE5FF',
  },
  galleryPickText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 8,
  },
  previewImage: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    marginTop: 10,
    resizeMode: 'cover',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F7F9FC',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  categoryChipTextActive: {
    color: '#FFF',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
