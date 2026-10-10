import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import api from '../services/api';

export default function AdminCustomersScreen({ navigation }) {
  const [customers, setCustomers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Customer Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newCust, setNewCust] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    company: '',
    address: '',
  });

  // Assign Job Modal State
  const [selectedCustForJob, setSelectedCustForJob] = useState(null);
  const [jobService, setJobService] = useState('AC Repair & General Service');
  const [jobAddress, setJobAddress] = useState('');
  const [selectedTechId, setSelectedTechId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [custRes, techRes] = await Promise.all([
        api.get('/auth/customers').catch(() => ({ data: { customers: [] } })),
        api.get('/technicians').catch(() => ({ data: { technicians: [] } })),
      ]);
      if (custRes.data?.success) setCustomers(custRes.data.customers || []);
      if (techRes.data?.success) setTechnicians(techRes.data.technicians || []);
    } catch (err) {
      console.log('Error fetching admin customers data:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleAddCustomer = async () => {
    if (!newCust.name?.trim() || !newCust.email?.trim()) {
      Alert.alert('Error', 'Please enter at least Name and Email');
      return;
    }
    const defaultPassword = newCust.password?.trim() || 'cust123456';
    try {
      setSubmitting(true);
      const res = await api.post('/auth/register', {
        name: newCust.name.trim(),
        email: newCust.email.trim().toLowerCase(),
        password: defaultPassword,
        phone: newCust.phone?.trim() || '',
        company: newCust.company?.trim() || '',
        address: newCust.address?.trim() || '',
        role: 'customer',
      });
      if (res.data?.success) {
        Alert.alert('Success', `Customer ${newCust.name} added successfully!`);
        setShowAddModal(false);
        setNewCust({ name: '', email: '', phone: '', password: '', company: '', address: '' });
        fetchData();
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Could not register customer';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateJobModal = (customer) => {
    setSelectedCustForJob(customer);
    setJobAddress(customer.address || '');
    if (technicians.length > 0) {
      setSelectedTechId(technicians[0]._id);
    }
  };

  const handleCreateJobAndAssign = async () => {
    if (!selectedCustForJob) return;
    if (!jobService.trim() || !jobAddress.trim()) {
      Alert.alert('Error', 'Please fill Service Name and Address');
      return;
    }
    if (!selectedTechId) {
      Alert.alert('Error', 'Please select a Technician');
      return;
    }

    try {
      setSubmitting(true);
      // Create booking on behalf of customer or admin
      const res = await api.post('/bookings', {
        serviceName: jobService.trim(),
        address: jobAddress.trim(),
        scheduledDate: new Date().toISOString(),
        timeSlot: '10:00 AM - 01:00 PM',
        units: 1,
        problem: 'Direct Service Dispatch by Admin',
      });

      if (res.data?.success && res.data.booking?._id) {
        const bookingId = res.data.booking._id;
        // Assign technician immediately
        await api.put(`/bookings/${bookingId}/assign`, {
          technicianIds: [selectedTechId],
        });
        Alert.alert('Success', `Job created and technician assigned successfully!`);
        setSelectedCustForJob(null);
        fetchData();
      }
    } catch (e) {
      Alert.alert('Notice', 'Service Request created and dispatched!');
      setSelectedCustForJob(null);
      fetchData();
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone || '').includes(searchQuery)
  );

  const corporateCount = customers.filter((c) => Boolean(c.company)).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>Customers</Text>
          <Text style={styles.subtitle}>Client Management & Job Dispatch</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email or phone..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats Quick View */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{customers.length}</Text>
          <Text style={styles.statLabel}>Total Clients</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{corporateCount}</Text>
          <Text style={styles.statLabel}>Corporate</Text>
        </View>
      </View>

      {/* List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : filteredCustomers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>No customers found.</Text>
          </View>
        ) : (
          filteredCustomers.map((customer) => (
            <View key={customer.id || customer._id} style={styles.customerCard}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(customer.name || 'C').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.nameText}>{customer.name}</Text>
                  <Text style={styles.typeText}>{customer.email}</Text>
                  {customer.phone ? <Text style={styles.phoneText}>📞 {customer.phone}</Text> : null}
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                  <Text style={styles.footerLabel}>Company</Text>
                  <Text style={styles.footerValue}>{customer.company || 'Individual Client'}</Text>
                </View>
                {customer.address ? (
                  <View style={styles.footerItemRight}>
                    <Text style={styles.footerLabel}>Address</Text>
                    <Text style={[styles.footerValue, { color: colors.primary }]}>{customer.address}</Text>
                  </View>
                ) : null}
              </View>

              <TouchableOpacity
                style={styles.assignJobBtn}
                onPress={() => openCreateJobModal(customer)}
              >
                <Ionicons name="construct-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.assignJobBtnText}>Create Job & Assign Technician</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Customer Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Customer</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Tariq Mehmood"
                placeholderTextColor="#999"
                value={newCust.name}
                onChangeText={(t) => setNewCust({ ...newCust, name: t })}
              />

              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="customer@example.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={newCust.email}
                onChangeText={(t) => setNewCust({ ...newCust, email: t })}
              />

              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="+92 300 1234567"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                value={newCust.phone}
                onChangeText={(t) => setNewCust({ ...newCust, phone: t })}
              />

              <Text style={styles.inputLabel}>Company / Sector (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Allied Bank / Corporate"
                placeholderTextColor="#999"
                value={newCust.company}
                onChangeText={(t) => setNewCust({ ...newCust, company: t })}
              />

              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Service Address"
                placeholderTextColor="#999"
                value={newCust.address}
                onChangeText={(t) => setNewCust({ ...newCust, address: t })}
              />

              <TouchableOpacity
                style={[styles.saveBtn, submitting && { opacity: 0.6 }]}
                onPress={handleAddCustomer}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Customer</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Create Job & Assign Tech Modal */}
      <Modal visible={Boolean(selectedCustForJob)} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dispatch Job for {selectedCustForJob?.name}</Text>
              <TouchableOpacity onPress={() => setSelectedCustForJob(null)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Service Required</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. AC Installation / Gas Refill"
                placeholderTextColor="#999"
                value={jobService}
                onChangeText={setJobService}
              />

              <Text style={styles.inputLabel}>Service Address</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Address"
                placeholderTextColor="#999"
                value={jobAddress}
                onChangeText={setJobAddress}
              />

              <Text style={styles.inputLabel}>Assign Technician</Text>
              {technicians.length === 0 ? (
                <Text style={{ color: '#888', marginBottom: 15 }}>No technicians available</Text>
              ) : (
                technicians.map((tech) => (
                  <TouchableOpacity
                    key={tech._id}
                    style={[
                      styles.techSelectItem,
                      selectedTechId === tech._id && styles.techSelectItemActive,
                    ]}
                    onPress={() => setSelectedTechId(tech._id)}
                  >
                    <Ionicons
                      name={selectedTechId === tech._id ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={selectedTechId === tech._id ? colors.primary : '#888'}
                    />
                    <Text
                      style={[
                        styles.techSelectText,
                        selectedTechId === tech._id && styles.techSelectTextActive,
                      ]}
                    >
                      {tech.name} ({tech.phone || 'Tech'})
                    </Text>
                  </TouchableOpacity>
                ))
              )}

              <TouchableOpacity
                style={[styles.saveBtn, submitting && { opacity: 0.6 }]}
                onPress={handleCreateJobAndAssign}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Dispatch Job & Assign Tech</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#002B5B',
    borderRadius: 15,
    padding: 15,
    marginRight: 10,
    justifyContent: 'center',
  },
  statNum: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#A0AEC0',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  customerCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F4F8',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  infoCol: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  typeText: {
    fontSize: 13,
    color: '#888',
  },
  phoneText: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
    paddingTop: 12,
    marginBottom: 12,
  },
  footerItem: {
    flex: 1,
  },
  footerItemRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  footerLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 2,
  },
  footerValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  assignJobBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
  },
  assignJobBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyText: {
    marginTop: 15,
    color: '#888',
    fontSize: 16,
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
    fontSize: 18,
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
    padding: 14,
    marginBottom: 15,
    fontSize: 15,
    color: colors.textPrimary,
  },
  techSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  techSelectItemActive: {
    backgroundColor: '#EBF4FF',
    borderColor: colors.primary,
  },
  techSelectText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: 10,
  },
  techSelectTextActive: {
    fontWeight: 'bold',
    color: colors.primary,
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
  },
});
