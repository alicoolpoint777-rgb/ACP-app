import React, { useEffect, useRef, useState, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const { width } = Dimensions.get('window');

export default function TechnicianJobsScreen({ navigation }) {
  const { userData, logout } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cardTranslateYValues = useRef([new Animated.Value(50), new Animated.Value(50), new Animated.Value(50)]).current;
  const cardOpacityValues = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

  const fetchJobs = async () => {
    try {
      const res = await api.get('/bookings');
      if (res.data?.success) {
        setJobs(res.data.bookings || []);
      }
    } catch (err) {
      console.log('Error fetching technician jobs:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refetch whenever the screen regains focus (e.g. after completing a job).
  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [])
  );

  useEffect(() => {
    const animations = cardTranslateYValues.map((val, index) => {
      return Animated.parallel([
        Animated.timing(val, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacityValues[index], {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        })
      ]);
    });
    
    Animated.stagger(150, animations).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const assignedCount = jobs.length;
  const completedCount = jobs.filter(j => j.status === 'completed').length;
  const pendingCount = jobs.filter(j => j.status !== 'completed').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello {userData?.name || 'Technician'} 👋</Text>
          <Text style={styles.title}>Manage Your{'\n'}Assigned Jobs</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={24} color="#FF4757" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />}
      >
        
        {/* Bento Box Stats */}
        <View style={styles.bentoContainer}>
          {/* Large Card */}
          <Animated.View style={[styles.largeCard, { opacity: cardOpacityValues[0], transform: [{ translateY: cardTranslateYValues[0] }] }]}>
            <LinearGradient colors={['#1E4C85', '#0B294F']} style={StyleSheet.absoluteFillObject} borderRadius={20} />
            <Ionicons name="briefcase" size={40} color="#FFF" />
            <View style={styles.bentoTextWrapper}>
              <Text style={styles.bentoTitleLight}>Assigned</Text>
              <Text style={styles.bentoSubLight}>{assignedCount} Jobs</Text>
            </View>
          </Animated.View>

          {/* Small Cards Column */}
          <View style={styles.smallCardsCol}>
            <Animated.View style={[styles.smallCard, { backgroundColor: 'rgba(47, 133, 90, 0.2)', opacity: cardOpacityValues[1], transform: [{ translateY: cardTranslateYValues[1] }] }]}>
              <Ionicons name="checkmark-circle" size={28} color="#48BB78" />
              <View style={styles.bentoTextWrapperRow}>
                <Text style={styles.bentoTitleLightSmall}>Completed</Text>
                <Text style={styles.bentoSubLightSmall}>{completedCount} Jobs</Text>
              </View>
            </Animated.View>

            <Animated.View style={[styles.smallCard, { backgroundColor: 'rgba(214, 158, 46, 0.2)', opacity: cardOpacityValues[2], transform: [{ translateY: cardTranslateYValues[2] }] }]}>
              <Ionicons name="time" size={28} color="#ECC94B" />
              <View style={styles.bentoTextWrapperRow}>
                <Text style={styles.bentoTitleLightSmall}>Pending</Text>
                <Text style={styles.bentoSubLightSmall}>{pendingCount} Jobs</Text>
              </View>
            </Animated.View>
          </View>
        </View>

        {/* Ongoing Jobs List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ongoing Jobs</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={styles.seeAll}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#63B3ED" style={{ marginTop: 30 }} />
        ) : jobs.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Ionicons name="clipboard-outline" size={48} color="#A0AEC0" />
            <Text style={{ color: '#A0AEC0', marginTop: 12, fontSize: 16 }}>No jobs assigned yet.</Text>
          </View>
        ) : (
          jobs.map((job) => (
            <TouchableOpacity 
              key={job._id || job.id} 
              activeOpacity={0.9} 
              style={styles.jobCard} 
              onPress={() => navigation.navigate('JobDetails', { job })}
            >
              <View style={styles.jobHeader}>
                <View style={[styles.badge, job.status === 'in_progress' ? styles.badgeHigh : styles.badgeMedium]}>
                  <Text style={styles.badgeText}>{job.status === 'in_progress' ? 'IN PROGRESS' : (job.status || 'ASSIGNED').toUpperCase()}</Text>
                </View>
                <Text style={{ color: '#63B3ED', fontWeight: 'bold' }}>{job.bookingNo || ''}</Text>
              </View>
              
              <Text style={styles.jobTitle}>{job.serviceName || job.title}</Text>
              
              <View style={styles.jobInfoGrid}>
                <View style={styles.jobInfoItem}>
                  <Ionicons name="time-outline" size={16} color="#A0AEC0" />
                  <Text style={styles.jobInfoText}>{job.timeSlot || job.time || 'Flexible'}</Text>
                </View>
                <View style={styles.jobInfoItem}>
                  <Ionicons name="calendar-outline" size={16} color="#A0AEC0" />
                  <Text style={styles.jobInfoText}>
                    {job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString() : 'Today'}
                  </Text>
                </View>
                <View style={[styles.jobInfoItem, { width: '100%', marginTop: 10 }]}>
                  <Ionicons name="location-outline" size={16} color="#A0AEC0" />
                  <Text style={styles.jobInfoText}>{job.address}</Text>
                </View>
              </View>

              <View style={styles.jobFooter}>
                <View style={styles.customerInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(job.customer?.name || 'C').slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.customerName}>{job.customer?.name || 'Customer'}</Text>
                    <Text style={styles.customerPhone}>{job.customer?.phone || 'No phone'}</Text>
                  </View>
                </View>
                
                <TouchableOpacity style={styles.startJobBtn} onPress={(e) => {
                  e.stopPropagation();
                  navigation.navigate('JobDetails', { job });
                }}>
                  <Text style={styles.startJobText}>Details</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" style={{ marginLeft: 5 }} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Padding for custom bottom bar */}
        <View style={{ height: 100 }} /> 
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002B5B', // Dark Navy Theme
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  greeting: {
    color: '#A0AEC0',
    fontSize: 14,
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '900',
  },
  notificationBtn: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    backgroundColor: '#FF4757',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  bentoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 220,
    marginBottom: 30,
  },
  largeCard: {
    width: '45%',
    height: '100%',
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  smallCardsCol: {
    width: '50%',
    justifyContent: 'space-between',
  },
  smallCard: {
    width: '100%',
    height: '47%',
    borderRadius: 20,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  bentoTextWrapper: {
    marginTop: 10,
  },
  bentoTextWrapperRow: {
    marginLeft: 10,
    flex: 1,
  },
  bentoTitleLight: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bentoSubLight: {
    color: '#A0AEC0',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  bentoTitleLightSmall: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bentoSubLightSmall: {
    color: '#A0AEC0',
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAll: {
    color: '#63B3ED',
    fontSize: 14,
    fontWeight: 'bold',
  },
  jobCard: {
    backgroundColor: '#0F3A68', // Lighter Navy
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
  },
  badgeHigh: {
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
  },
  badgeMedium: {
    backgroundColor: 'rgba(255, 165, 2, 0.2)',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  jobTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  jobInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  jobInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
  },
  jobInfoText: {
    color: '#E2E8F0',
    fontSize: 13,
    marginLeft: 8,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  customerName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  customerPhone: {
    color: '#A0AEC0',
    fontSize: 11,
    marginTop: 2,
  },
  startJobBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007BFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
  },
  startJobText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  }
});
