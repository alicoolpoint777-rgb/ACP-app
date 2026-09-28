import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const { width } = Dimensions.get('window');

export default function CustomerOrdersScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Active');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { userData, logout } = useContext(AuthContext);

  const fetchCustomerBookings = async () => {
    try {
      const res = await api.get('/bookings');
      if (res.data?.success) {
        setBookings(res.data.bookings || []);
      }
    } catch (err) {
      console.log('Error fetching customer bookings:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomerBookings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomerBookings();
  };

  const activeBookings = bookings.filter(b => 
    ['pending', 'confirmed', 'assigned', 'in_progress'].includes(b.status)
  );
  const historyBookings = bookings.filter(b => 
    ['completed', 'cancelled'].includes(b.status)
  );

  const displayedList = activeTab === 'Active' ? activeBookings : historyBookings;

  const renderOrderCard = (order) => (
    <View key={order._id || order.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{order.bookingNo || 'Service'}</Text>
        </View>
        <Text style={[styles.statusText, order.status === 'pending' ? styles.pendingText : styles.transitText]}>
          {(order.status || 'Active').toUpperCase()}
        </Text>
      </View>
      
      <Text style={styles.title}>{order.serviceName || 'AC Service'}</Text>
      
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={16} color="#888" />
          <Text style={styles.detailText}>
            {order.scheduledDate ? new Date(order.scheduledDate).toLocaleDateString() : 'Scheduled'}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color="#888" />
          <Text style={styles.detailText}>{order.timeSlot || 'Flexible'}</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.price}>{order.price ? `Rs ${order.price.toLocaleString()}` : 'Rs 2,500'}</Text>
        <View style={styles.actionButtons}>
          <View style={styles.trackBtn}>
            <Text style={styles.trackBtnText}>{order.status === 'completed' ? 'Done' : 'Active'}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#FF4757" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(userData?.name || 'C').slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userData?.name || 'Customer'}</Text>
            <Text style={styles.profileEmail}>{userData?.email || 'customer@acp.com'}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{activeBookings.length}</Text>
            <Text style={styles.statLabel}>Active Orders</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {['Active', 'History'].map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : displayedList.length > 0 ? (
          displayedList.map(renderOrderCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={60} color="#CCC" />
            <Text style={styles.emptyText}>No {activeTab.toLowerCase()} orders found.</Text>
          </View>
        )}
      </ScrollView>
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
  logoutBtn: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 15,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  profileEmail: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  statBox: {
    alignItems: 'center',
    paddingLeft: 15,
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 10,
    color: '#888',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#E2E8F0',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  activeTabText: {
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  typeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  pendingText: {
    color: '#DD6B20',
  },
  transitText: {
    color: '#2F855A',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 15,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  detailText: {
    marginLeft: 5,
    color: '#666',
    fontSize: 14,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
    paddingTop: 15,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  cancelBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFF0F1',
    marginRight: 10,
  },
  cancelBtnText: {
    color: '#FF4757',
    fontWeight: 'bold',
  },
  trackBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  trackBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    marginTop: 15,
    color: '#888',
    fontSize: 16,
  }
});
