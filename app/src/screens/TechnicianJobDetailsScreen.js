import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api, { getErrorMessage } from '../services/api';

const STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function pickImage() {
  return ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.4,
    base64: true,
  });
}

export default function TechnicianJobDetailsScreen({ route, navigation }) {
  const { job: initialJob } = route.params || {};
  const [job, setJob] = useState(initialJob || null);
  const [status, setStatus] = useState(initialJob?.status || 'assigned');
  const [beforeImages, setBeforeImages] = useState(initialJob?.beforeImages || []);
  const [afterImages, setAfterImages] = useState(initialJob?.afterImages || []);
  const [busy, setBusy] = useState(false);

  const jobId = job?._id || job?.id;
  const customer = job?.customer || {};

  const uploadImages = async (nextBefore, nextAfter) => {
    await api.post(`/bookings/${jobId}/evidence`, {
      beforeImages: nextBefore,
      afterImages: nextAfter,
    });
  };

  const handlePickImage = async (which) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Allow photo access to attach job evidence.');
        return;
      }
      const result = await pickImage();
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const dataUri = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;

      const nextBefore = which === 'before' ? [...beforeImages, dataUri] : beforeImages;
      const nextAfter = which === 'after' ? [...afterImages, dataUri] : afterImages;
      if (which === 'before') setBeforeImages(nextBefore);
      else setAfterImages(nextAfter);

      try {
        await uploadImages(nextBefore, nextAfter);
      } catch (e) {
        Alert.alert('Upload failed', getErrorMessage(e, 'Could not save the photo. It is kept locally.'));
      }
    } catch (e) {
      Alert.alert('Error', getErrorMessage(e, 'Could not open the photo library.'));
    }
  };

  const handleStart = async () => {
    if (!jobId || busy) return;
    try {
      setBusy(true);
      const res = await api.put(`/bookings/${jobId}/start`);
      if (res.data?.success) {
        setJob(res.data.booking);
        setStatus(res.data.booking.status);
      }
    } catch (e) {
      Alert.alert('Error', getErrorMessage(e, 'Could not start the job.'));
    } finally {
      setBusy(false);
    }
  };

  const handleComplete = async () => {
    if (!jobId || busy) return;
    if (afterImages.length === 0) {
      Alert.alert('Evidence required', 'Please add at least one "After" photo before completing.');
      return;
    }
    try {
      setBusy(true);
      const res = await api.put(`/bookings/${jobId}/complete`, { afterImages });
      if (res.data?.success) {
        Alert.alert('Job Completed', 'Great work! The job has been marked complete.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e) {
      Alert.alert('Error', getErrorMessage(e, 'Could not complete the job.'));
    } finally {
      setBusy(false);
    }
  };

  const callCustomer = () => {
    if (customer.phone) Linking.openURL(`tel:${customer.phone}`);
    else Alert.alert('No phone', 'This customer has no phone number on file.');
  };

  if (!job) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Job not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isCompleted = status === 'completed';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Job Info Card */}
        <View style={styles.card}>
          <Text style={styles.jobTitle}>{job.serviceName || job.title || 'Job'}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{STATUS_LABEL[status] || status}</Text>
          </View>

          {job.bookingNo ? (
            <View style={styles.infoRow}>
              <Ionicons name="pricetag-outline" size={20} color="#A0AEC0" />
              <Text style={styles.infoText}>{job.bookingNo}</Text>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#A0AEC0" />
            <Text style={styles.infoText}>{job.address || 'No address'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#A0AEC0" />
            <Text style={styles.infoText}>
              {job.timeSlot || 'Flexible'}
              {job.scheduledDate ? `  |  ${new Date(job.scheduledDate).toLocaleDateString()}` : ''}
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionHeading}>Customer Details</Text>
          <View style={styles.customerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(customer.name || 'C').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{customer.name || 'Customer'}</Text>
              <Text style={styles.customerPhone}>{customer.phone || 'No phone'}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={callCustomer}>
              <Ionicons name="call" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Requirements Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Job Requirements</Text>
          <Text style={styles.descText}>
            {job.problem
              ? job.problem
              : 'No specific problem was described for this job.'}
          </Text>
          {(job.acType || job.units) && (
            <Text style={[styles.descText, { marginTop: 10, color: '#A0AEC0' }]}>
              {job.acType ? `AC Type: ${job.acType === 'Other' ? job.acTypeOther || 'Other' : job.acType}` : ''}
              {job.units ? `   •   Units: ${job.units}` : ''}
            </Text>
          )}
        </View>

        {/* Picture Upload Section */}
        <Text style={styles.uploadTitle}>Work Proof (Before / After)</Text>
        <View style={styles.uploadContainer}>
          <TouchableOpacity style={styles.uploadBox} onPress={() => handlePickImage('before')}>
            {beforeImages.length > 0 ? (
              <Image source={{ uri: beforeImages[beforeImages.length - 1] }} style={styles.uploadedImg} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={32} color="#A0AEC0" />
                <Text style={styles.uploadText}>Before</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.uploadBox} onPress={() => handlePickImage('after')}>
            {afterImages.length > 0 ? (
              <Image source={{ uri: afterImages[afterImages.length - 1] }} style={styles.uploadedImg} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={32} color="#A0AEC0" />
                <Text style={styles.uploadText}>After</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        {(beforeImages.length > 1 || afterImages.length > 1) && (
          <Text style={styles.photoCount}>
            {beforeImages.length} before • {afterImages.length} after photo(s) saved
          </Text>
        )}
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomBar}>
        {isCompleted ? (
          <View style={[styles.completeBtn, { backgroundColor: '#2F855A' }]}>
            <Text style={styles.completeBtnText}>Completed</Text>
            <Ionicons name="checkmark-done" size={20} color="#FFF" style={{ marginLeft: 10 }} />
          </View>
        ) : status === 'assigned' ? (
          <TouchableOpacity
            style={[styles.completeBtn, { backgroundColor: '#007BFF' }, busy && { opacity: 0.6 }]}
            disabled={busy}
            onPress={handleStart}
          >
            {busy ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Text style={styles.completeBtnText}>Start Job</Text>
                <Ionicons name="play" size={18} color="#FFF" style={{ marginLeft: 10 }} />
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.completeBtn, busy && { opacity: 0.6 }]}
            disabled={busy}
            onPress={handleComplete}
          >
            {busy ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Text style={styles.completeBtnText}>Mark as Completed</Text>
                <Ionicons name="checkmark-done" size={20} color="#FFF" style={{ marginLeft: 10 }} />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002B5B', // Dark Navy
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#A0AEC0',
    fontSize: 16,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: '#0F3A68',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  jobTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(47, 133, 90, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusText: {
    color: '#48BB78',
    fontWeight: 'bold',
    fontSize: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    color: '#E2E8F0',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 15,
  },
  sectionHeading: {
    color: '#A0AEC0',
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  customerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  customerName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  customerPhone: {
    color: '#A0AEC0',
    fontSize: 13,
    marginTop: 2,
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  descText: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 22,
  },
  uploadTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  uploadContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  uploadBox: {
    width: '48%',
    height: 120,
    backgroundColor: '#0F3A68',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  uploadText: {
    color: '#A0AEC0',
    fontSize: 13,
    marginTop: 8,
    fontWeight: 'bold',
  },
  uploadedImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoCount: {
    color: '#A0AEC0',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#0F3A68',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  completeBtn: {
    backgroundColor: '#2F855A',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 12,
  },
  completeBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
