import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import api from '../services/api';

const { width } = Dimensions.get('window');

const AnimatedCounter = ({ endValue, duration = 800, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: endValue || 0,
      duration: duration,
      useNativeDriver: false,
    }).start();

    const listener = animValue.addListener((v) => {
      setCount(Math.floor(v.value));
    });

    return () => {
      animValue.removeListener(listener);
    };
  }, [endValue]);

  return <Text style={styles.statValue}>{prefix}{count.toLocaleString()}{suffix}</Text>;
};

export default function AdminDashboardScreen({ navigation }) {
  const [metrics, setMetrics] = useState({
    pendingRequests: 0,
    customersCount: 0,
    techniciansCount: 0,
    activeBookings: 0,
    totalEarnings: 0,
    recentRequests: [],
    topTechnicians: [],
  });
  const [loading, setLoading] = useState(true);

  // Animations
  const listOpacity = useRef(new Animated.Value(0)).current;
  const listTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, techRes, custRes, purchasesRes] = await Promise.all([
        api.get('/bookings').catch(() => ({ data: { bookings: [] } })),
        api.get('/technicians').catch(() => ({ data: { technicians: [] } })),
        api.get('/auth/customers').catch(() => ({ data: { customers: [] } })),
        api.get('/purchases').catch(() => ({ data: { purchases: [] } })),
      ]);

      const bookings = bookingsRes.data?.bookings || [];
      const techs = techRes.data?.technicians || [];
      const customers = custRes.data?.customers || [];
      const purchases = purchasesRes.data?.purchases || [];

      const pending = bookings.filter(b => b.status === 'pending').length;
      const active = bookings.filter(b => ['assigned', 'in_progress', 'confirmed'].includes(b.status)).length;
      
      const completedBookings = bookings.filter(b => b.status === 'completed');
      const serviceEarnings = completedBookings.reduce((sum, b) => sum + (Number(b.price || b.totalAmount || 0)), 0);
      const purchaseEarnings = purchases.reduce((sum, p) => sum + (Number(p.product?.price || p.price || 0)), 0);
      const totalEarnings = serviceEarnings + purchaseEarnings;

      const recent = bookings.slice(0, 5);
      const topTechs = [...techs].sort((a, b) => (b.completedJobs || 0) - (a.completedJobs || 0)).slice(0, 3);

      setMetrics({
        pendingRequests: pending,
        customersCount: customers.length,
        techniciansCount: techs.length,
        activeBookings: active,
        totalEarnings,
        recentRequests: recent,
        topTechnicians: topTechs,
      });

      Animated.parallel([
        Animated.timing(listOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(listTranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    } catch (e) {
      console.log('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'completed') return '#2F855A';
    if (status === 'assigned' || status === 'in_progress') return '#007BFF';
    if (status === 'cancelled') return '#FF4757';
    return '#FF9800'; // pending
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Admin Panel</Text>
          <Text style={styles.subtitle}>Realtime Overview & Operations</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={fetchDashboardData}>
          <Ionicons name="refresh" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Top Metric Cards */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
              <View style={[styles.statCard, { backgroundColor: '#FF9800' }]}>
                <Ionicons name="time-outline" size={24} color={colors.surface} />
                <Text style={styles.statLabelLight}>Pending Requests</Text>
                <AnimatedCounter endValue={metrics.pendingRequests} />
              </View>

              <View style={styles.statCard}>
                <Ionicons name="people-outline" size={24} color={colors.primary} />
                <Text style={styles.statLabel}>Customers</Text>
                <AnimatedCounter endValue={metrics.customersCount} />
              </View>

              <View style={styles.statCard}>
                <Ionicons name="construct-outline" size={24} color={colors.primary} />
                <Text style={styles.statLabel}>Technicians</Text>
                <AnimatedCounter endValue={metrics.techniciansCount} />
              </View>

              <View style={[styles.statCard, { backgroundColor: '#2F855A' }]}>
                <Ionicons name="calendar-outline" size={24} color={colors.surface} />
                <Text style={styles.statLabelLight}>Active Jobs</Text>
                <AnimatedCounter endValue={metrics.activeBookings} />
              </View>
            </ScrollView>

            {/* Earnings Summary Card */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Business Summary</Text>
              </View>
              
              <View style={styles.chartCard}>
                <Text style={styles.chartTotal}>Rs {metrics.totalEarnings.toLocaleString()}</Text>
                <Text style={styles.chartSub}>Total Revenue from Completed Jobs</Text>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryNum}>{metrics.pendingRequests + metrics.activeBookings}</Text>
                    <Text style={styles.summaryLabel}>Open Bookings</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryNum}>{metrics.techniciansCount}</Text>
                    <Text style={styles.summaryLabel}>Staff On Team</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryNum}>{metrics.customersCount}</Text>
                    <Text style={styles.summaryLabel}>Total Clients</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Team / Technicians */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Technicians Team</Text>
                {navigation && (
                  <TouchableOpacity onPress={() => navigation.navigate('Techs')}>
                    <Text style={styles.seeAll}>Manage Team</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.listCard}>
                {metrics.topTechnicians.length === 0 ? (
                  <Text style={styles.emptyText}>No technicians registered yet.</Text>
                ) : (
                  metrics.topTechnicians.map((tech, idx) => (
                    <View key={tech._id || idx} style={[styles.listItem, idx === metrics.topTechnicians.length - 1 && { borderBottomWidth: 0 }]}>
                      <View style={styles.rankBadge}><Text style={styles.rankText}>{idx + 1}</Text></View>
                      <View style={styles.listAvatar}>
                        <Text style={styles.listAvatarText}>{(tech.name || 'T').charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={styles.listInfo}>
                        <Text style={styles.listName}>{tech.name}</Text>
                        <Text style={styles.listSub}>{tech.status || 'Active'} • {tech.phone || tech.email}</Text>
                      </View>
                      <Text style={styles.listAmount}>{tech.completedJobs || 0} Jobs</Text>
                    </View>
                  ))
                )}
              </View>
            </View>

            {/* Recent Requests */}
            <Animated.View style={{ opacity: listOpacity, transform: [{ translateY: listTranslateY }] }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Recent Requests</Text>
                {navigation && (
                  <TouchableOpacity onPress={() => navigation.navigate('Requests')}>
                    <Text style={styles.seeAll}>View All</Text>
                  </TouchableOpacity>
                )}
              </View>

              {metrics.recentRequests.length === 0 ? (
                <View style={styles.listCard}>
                  <Text style={styles.emptyText}>No customer requests received yet.</Text>
                </View>
              ) : (
                metrics.recentRequests.map((item, index) => {
                  const statusColor = getStatusColor(item.status);
                  const dateStr = item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString() : '';
                  return (
                    <View key={item._id || index} style={styles.activityCard}>
                      <View style={[styles.iconBox, { backgroundColor: statusColor + '20' }]}>
                        <Ionicons 
                          name={item.status === 'completed' ? "checkmark-circle" : "time"} 
                          size={24} 
                          color={statusColor} 
                        />
                      </View>
                      <View style={styles.activityInfo}>
                        <Text style={styles.activityTitle}>{item.serviceName || item.service?.name || 'Service Request'}</Text>
                        <Text style={styles.activitySub}>
                          {item.customer?.name || 'Customer'} • <Text style={{ color: statusColor, fontWeight: 'bold' }}>{String(item.status || 'pending').toUpperCase()}</Text>
                        </Text>
                      </View>
                      <Text style={styles.activityTime}>{dateStr || item.timeSlot || ''}</Text>
                    </View>
                  );
                })
              )}
            </Animated.View>
          </>
        )}
        
        <View style={{ height: 100 }} />
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
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  statsScroll: {
    overflow: 'visible',
    marginBottom: 25,
  },
  statCard: {
    width: 145,
    height: 145,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 18,
    marginRight: 12,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: 10,
    fontWeight: '600',
  },
  statLabelLight: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 10,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAll: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  chartCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  chartTotal: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  chartSub: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
    marginBottom: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
    paddingTop: 15,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNum: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 3,
  },
  listCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ECC94B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listAvatarText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  listSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  listAmount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2F855A',
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    paddingVertical: 15,
    fontSize: 13,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  activitySub: {
    fontSize: 12,
    color: '#888',
  },
  activityTime: {
    fontSize: 11,
    color: '#AAA',
    marginLeft: 10,
  }
});
