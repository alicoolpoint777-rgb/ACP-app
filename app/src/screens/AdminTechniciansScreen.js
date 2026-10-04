import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions, TextInput, Alert, Modal, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import api from '../services/api';

const { width } = Dimensions.get('window');

export default function AdminTechniciansScreen() {
  const [techs, setTechs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTech, setNewTech] = useState({ name: '', email: '', password: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTechs();
  }, []);

  const fetchTechs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/technicians');
      if (res?.data?.success) {
        const list = res.data.technicians;
        setTechs(Array.isArray(list) ? list.filter(Boolean) : []);
      }
    } catch (error) {
      console.log('Error fetching technicians:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderStatusDot = (status) => {
    let color = '#2F855A'; // Active / Available
    if (status === 'On Job' || status === 'busy') color = '#DD6B20';
    if (status === 'inactive') color = '#AAA';
    return <View style={[styles.statusDot, { backgroundColor: color }]} />;
  };

  const filteredTechs = (Array.isArray(techs) ? techs : []).filter(t => {
    const query = (searchQuery || '').toLowerCase();
    return (
      (t?.name || '').toLowerCase().includes(query) ||
      (t?.status || '').toLowerCase().includes(query) ||
      (t?.email || '').toLowerCase().includes(query)
    );
  });

  const getErrorMessage = (e, fallback) => {
    const msg = e?.response?.data?.message;
    return typeof msg === 'string' && msg.trim() ? msg : fallback;
  };

  const handleAddTech = async () => {
    if (!newTech.name?.trim() || !newTech.email?.trim() || !newTech.password) {
      Alert.alert('Error', 'Please fill name, email and password');
      return;
    }
    if (newTech.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }
    if (submitting) return;
    try {
      setSubmitting(true);
      const res = await api.post('/technicians', {
        name: newTech.name.trim(),
        email: newTech.email.trim().toLowerCase(),
        password: newTech.password,
        phone: newTech.phone?.trim() || '',
        payoutType: 'salary',
        payoutAmount: 0,
      });
      if (res?.data?.success) {
        setShowAddModal(false);
        setNewTech({ name: '', email: '', password: '', phone: '' });
        fetchTechs();
        Alert.alert('Success', 'Technician added successfully');
      } else {
        Alert.alert('Error', getErrorMessage({ response: res }, 'Failed to add technician'));
      }
    } catch (e) {
      Alert.alert(
        'Error',
        getErrorMessage(e, 'Network error. Please check your connection and try again.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveTech = async (id) => {
    if (!id) return;
    Alert.alert('Remove Technician', 'Are you sure you want to remove this technician?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/technicians/${id}`);
          fetchTechs();
        } catch (e) {
          Alert.alert('Error', getErrorMessage(e, 'Failed to remove technician'));
        }
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Technicians</Text>
          <Text style={styles.subtitle}>Manage your team</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={24} color={colors.surface} />
          <Text style={styles.addBtnText}>Add Tech</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search technicians..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loading ? (
           <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
        ) : (
        <View>
          {filteredTechs.map((tech, index) => {
            const isExpanded = expandedId === tech?._id;

            return (
              <View key={tech?._id || `tech-${index}`} style={styles.techCard}>
                <TouchableOpacity 
                  activeOpacity={0.8} 
                  style={styles.cardHeader}
                  onPress={() => toggleExpand(tech?._id)}
                >
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{(tech?.name || 'T').charAt(0).toUpperCase()}</Text>
                      {renderStatusDot(tech?.status)}
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.name}>{tech?.name || 'Technician'}</Text>
                      <Text style={styles.statusText}>{tech?.status || 'Active'} • {tech?.completedJobs || 0} Jobs</Text>
                    </View>
                  </View>
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={24} 
                    color="#888" 
                  />
                </TouchableOpacity>

                {/* Collapsible Content */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <View style={styles.divider} />
                    
                    <View style={styles.statsRow}>
                      <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Email</Text>
                        <Text style={[styles.statValue, {fontSize: 14, fontWeight:'bold', color:colors.textPrimary}]}>{tech?.email || 'N/A'}</Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Phone</Text>
                        <Text style={[styles.statValue, {fontSize: 14, fontWeight:'bold', color:colors.textPrimary}]}>{tech?.phone || 'N/A'}</Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total Jobs</Text>
                        <Text style={styles.statValue}>{tech?.completedJobs || 0}</Text>
                      </View>
                    </View>

                    <View style={styles.actionList}>
                      {/* Delete */}
                      <TouchableOpacity style={[styles.actionListItem, { borderBottomWidth: 0 }]} onPress={() => handleRemoveTech(tech?._id)}>
                        <Ionicons name="trash-outline" size={20} color="#FF4757" />
                        <Text style={[styles.actionListItemText, { color: '#FF4757' }]}>Remove Technician</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}

        </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Tech Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Technician</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput 
                style={styles.modalInput}
                placeholder="Full Name"
                placeholderTextColor="#999"
                value={newTech.name}
                onChangeText={(t) => setNewTech({...newTech, name: t})}
              />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput 
                style={styles.modalInput}
                placeholder="Email Address"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={newTech.email}
                onChangeText={(t) => setNewTech({...newTech, email: t})}
              />

              <Text style={styles.inputLabel}>Phone (Optional)</Text>
              <TextInput 
                style={styles.modalInput}
                placeholder="+92 300 1234567"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                value={newTech.phone}
                onChangeText={(t) => setNewTech({...newTech, phone: t})}
              />

              <Text style={styles.inputLabel}>Password</Text>
              <TextInput 
                style={styles.modalInput}
                placeholder="Password (minimum 6 characters)"
                placeholderTextColor="#999"
                secureTextEntry
                value={newTech.password}
                onChangeText={(t) => setNewTech({...newTech, password: t})}
              />

              <TouchableOpacity
                style={[styles.saveBtn, submitting && { opacity: 0.6 }]}
                onPress={handleAddTech}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Technician</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  addBtnText: {
    color: colors.surface,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 10,
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
    paddingTop: 10,
  },
  techCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 20,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  info: {
    marginLeft: 15,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statusText: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  expandedContent: {
    marginTop: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F4F8',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  actionList: {
    backgroundColor: '#F7F9FC',
    borderRadius: 12,
    marginTop: 10,
  },
  actionListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  actionListItemText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    maxHeight: '90%',
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
  inputLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
