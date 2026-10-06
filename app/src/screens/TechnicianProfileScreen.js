import React, { useEffect, useRef, useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const { width } = Dimensions.get('window');

function formatCurrency(value) {
  const amount = Number(value) || 0;
  if (amount >= 1000) return `Rs ${(amount / 1000).toFixed(1)}k`;
  return `Rs ${amount}`;
}

export default function TechnicianProfileScreen() {
  const { logout, userData } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const avatarScale = useRef(new Animated.Value(0)).current;
  const statsTranslateY = useRef([new Animated.Value(50), new Animated.Value(50), new Animated.Value(50)]).current;
  const reviewTranslateY = useRef(new Animated.Value(100)).current;
  const reviewOpacity = useRef(new Animated.Value(0)).current;

  const runIntroAnimations = useCallback(() => {
    avatarScale.setValue(0);
    statsTranslateY.forEach((v) => v.setValue(50));
    reviewTranslateY.setValue(100);
    reviewOpacity.setValue(0);

    Animated.spring(avatarScale, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();

    const statAnims = statsTranslateY.map((val) =>
      Animated.spring(val, {
        toValue: 0,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      })
    );
    Animated.stagger(100, statAnims).start();

    Animated.parallel([
      Animated.timing(reviewTranslateY, {
        toValue: 0,
        duration: 600,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(reviewOpacity, {
        toValue: 1,
        duration: 600,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [avatarScale, statsTranslateY, reviewTranslateY, reviewOpacity]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/technicians/me');
      if (res.data?.success) {
        setProfile(res.data);
      }
    } catch (err) {
      console.log('Error fetching technician profile:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    runIntroAnimations();
    fetchProfile();
  }, [runIntroAnimations, fetchProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const technician = profile?.technician || userData || {};
  const stats = profile?.stats || {};
  const reviews = profile?.reviews || [];
  const displayName = technician.name || 'Technician';
  const initial = (displayName || 'T').charAt(0).toUpperCase();

  const toggleStatus = async () => {
    const newStatus = (technician.status === 'on_leave' ? 'active' : 'on_leave');
    try {
      const res = await api.patch('/technicians/me/status', { status: newStatus });
      if (res.data?.success) {
        setProfile((prev) => ({
          ...prev,
          technician: { ...(prev?.technician || {}), status: newStatus },
        }));
      }
    } catch (e) {
      console.log('Error updating status:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />}
      >
        {/* Header & Avatar */}
        <View style={styles.header}>
          <View style={styles.iconBtn} />
          <TouchableOpacity style={styles.iconBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <Animated.View style={[styles.avatarContainer, { transform: [{ scale: avatarScale }] }]}>
            <LinearGradient colors={['#FFE5B4', '#FFA502']} style={styles.avatarGradient}>
              <Text style={styles.avatarText}>{initial}</Text>
            </LinearGradient>
            <View style={[styles.onlineDot, { backgroundColor: technician.status === 'on_leave' ? '#ECC94B' : '#48BB78' }]} />
          </Animated.View>
          <Text style={styles.nameText}>{displayName}</Text>
          <Text style={styles.roleText}>
            {technician.employeeId ? `${technician.employeeId} • ` : ''}
            AC Technician
          </Text>

          <TouchableOpacity style={[styles.statusToggleBtn, { backgroundColor: technician.status === 'on_leave' ? 'rgba(236, 201, 75, 0.2)' : 'rgba(72, 187, 120, 0.2)' }]} onPress={toggleStatus}>
            <Ionicons name={technician.status === 'on_leave' ? 'moon' : 'checkmark-circle'} size={16} color={technician.status === 'on_leave' ? '#ECC94B' : '#48BB78'} />
            <Text style={[styles.statusToggleText, { color: technician.status === 'on_leave' ? '#ECC94B' : '#48BB78' }]}>
              {technician.status === 'on_leave' ? 'Status: On Leave' : 'Status: Available / Active'}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#FFE5B4" style={{ marginTop: 20 }} />
        ) : (
          <>
            {/* Performance Stats */}
            <View style={styles.statsContainer}>
              <Animated.View style={[styles.statBox, { transform: [{ translateY: statsTranslateY[0] }] }]}>
                <Ionicons name="briefcase-outline" size={24} color="#FFE5B4" />
                <Text style={styles.statValue}>{stats.completedJobs || 0}</Text>
                <Text style={styles.statLabel}>Total Jobs</Text>
              </Animated.View>

              <Animated.View style={[styles.statBox, { transform: [{ translateY: statsTranslateY[1] }] }]}>
                <Ionicons name="star-outline" size={24} color="#FFE5B4" />
                <Text style={styles.statValue}>{(stats.rating ?? 0).toFixed(1)}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </Animated.View>

              <Animated.View style={[styles.statBox, { transform: [{ translateY: statsTranslateY[2] }] }]}>
                <Ionicons name="wallet-outline" size={24} color="#FFE5B4" />
                <Text style={styles.statValue}>{formatCurrency(stats.earnings)}</Text>
                <Text style={styles.statLabel}>Earnings</Text>
              </Animated.View>
            </View>

            {/* Reviews Section */}
            <Animated.View style={{ opacity: reviewOpacity, transform: [{ translateY: reviewTranslateY }] }}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Reviews</Text>
              </View>

              {reviews.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="chatbubble-ellipses-outline" size={40} color="#A0AEC0" />
                  <Text style={styles.emptyText}>No reviews yet</Text>
                </View>
              ) : (
                reviews.map((review) => (
                  <View key={review._id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewName}>{review.customer?.name || 'Customer'}</Text>
                      <View style={styles.starsRow}>
                        {[...Array(5)].map((_, i) => (
                          <Ionicons
                            key={i}
                            name={i < review.rating ? 'star' : 'star-outline'}
                            size={14}
                            color="#FFE5B4"
                          />
                        ))}
                      </View>
                    </View>
                    {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
                    <Text style={styles.reviewDate}>
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                    </Text>
                  </View>
                ))
              )}
            </Animated.View>
          </>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  iconBtn: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarGradient: {
    flex: 1,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFF',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#002B5B',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  roleText: {
    fontSize: 14,
    color: '#63B3ED',
    marginBottom: 10,
  },
  statusToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 5,
  },
  statusToggleText: {
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  statBox: {
    width: (width - 60) / 3,
    backgroundColor: '#0F3A68',
    paddingVertical: 20,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 10,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#A0AEC0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: '#0F3A68',
    borderRadius: 15,
    paddingVertical: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyText: {
    color: '#A0AEC0',
    marginTop: 10,
    fontSize: 14,
  },
  reviewCard: {
    backgroundColor: '#0F3A68',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewName: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  starsRow: {
    flexDirection: 'row',
  },
  reviewComment: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  reviewDate: {
    color: '#A0AEC0',
    fontSize: 12,
  },
});
