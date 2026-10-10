import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';

export default function CustomerProfileScreen({ navigation }) {
  const { userData, logout } = useContext(AuthContext);

  const handleCall = () => {
    Linking.openURL('tel:+923001234567');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/923001234567?text=Hello%20Ali%20Cool%20Point,%20I%20need%20assistance');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Account & Support</Text>
        <TouchableOpacity style={styles.logoutHeaderBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={22} color="#FF4757" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{(userData?.name || 'C').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.userName}>{userData?.name || 'Customer'}</Text>
            <Text style={styles.userEmail}>{userData?.email || 'customer@acp.com'}</Text>
            {userData?.phone ? <Text style={styles.userPhone}>📱 {userData.phone}</Text> : null}
          </View>
        </View>

        {/* Contact & Support Section */}
        <Text style={styles.sectionHeader}>Contact Us & Help Center</Text>
        
        <View style={styles.supportCard}>
          <Text style={styles.supportTitle}>Ali Cool Point Customer Support</Text>
          <Text style={styles.supportDesc}>
            Need help with your AC service or product booking? Contact our team directly.
          </Text>

          <View style={styles.contactButtonsRow}>
            <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#2F855A' }]} onPress={handleCall}>
              <Ionicons name="call" size={18} color="#FFF" />
              <Text style={styles.contactBtnText}>Call Support</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#25D366' }]} onPress={handleWhatsApp}>
              <Ionicons name="logo-whatsapp" size={18} color="#FFF" />
              <Text style={styles.contactBtnText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={colors.primary} />
            <Text style={styles.infoRowText}>Phone: +92 300 1234567</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <Text style={styles.infoRowText}>Shop: Ali Cool Point, Main Service Road</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={styles.infoRowText}>Hours: Mon - Sat (9:00 AM - 9:00 PM)</Text>
          </View>
        </View>

        {/* Logout Action */}
        <TouchableOpacity style={styles.logoutCardBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#FF4757" />
          <Text style={styles.logoutCardText}>Sign Out of Account</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  logoutHeaderBtn: {
    padding: 5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  avatarBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
  },
  profileDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  userPhone: {
    fontSize: 13,
    color: colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  supportCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  supportDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 18,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    paddingVertical: 12,
    borderRadius: 10,
  },
  contactBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
  },
  infoRowText: {
    fontSize: 13,
    color: '#555',
    marginLeft: 10,
    fontWeight: '500',
  },
  logoutCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F1',
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD1D4',
  },
  logoutCardText: {
    color: '#FF4757',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
});
