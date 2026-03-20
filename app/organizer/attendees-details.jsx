import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const BASE_URL = 'https://eventpro-fxfv.onrender.com/api';
const PURPLE = '#6F00FF';
const PURPLE_LIGHT = '#F0E6FF';
const DARK = '#0F0F14';
const GRAY = '#6B7280';

const api = axios.create({ baseURL: BASE_URL });
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function AttendeeDetail() {
  const { attendeeId, eventId, eventTitle } = useLocalSearchParams();
  const [attendee, setAttendee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    const fetchAttendee = async () => {
      try {
        const res = await api.get(`/events/${eventId}/attendees`);
        const list = res.data?.attendees || res.data || [];
        const found = list.find(a => (a._id || a.id) === attendeeId);
        setAttendee(found);
      } catch {
        Alert.alert('Error', 'Could not load attendee details.');
      } finally {
        setLoading(false);
      }
    };
    if (attendeeId && eventId) fetchAttendee();
  }, [attendeeId, eventId]);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await api.post(`/events/${eventId}/checkin/scan`, {
        code: attendee?.checkInCode || attendeeId,
      });
      setAttendee(prev => ({ ...prev, status: 'Checked-In' }));
      Alert.alert('Success', `${attendee?.firstName} has been checked in!`);
    } catch (error) {
      const msg = error.response?.data?.message || 'Check-in failed. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleSendSMS = async () => {
    try {
      await api.post(`/events/${eventId}/checkin/send`, {
        attendeeIds: [attendeeId],
      });
      Alert.alert('Sent!', 'Check-in instructions have been sent via SMS.');
    } catch {
      Alert.alert('Error', 'Could not send SMS. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Attendee Details</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PURPLE} />
        </View>
      </SafeAreaView>
    );
  }

  if (!attendee) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Attendee Details</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Attendee not found.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.goBackBtn}>
            <Text style={styles.goBackText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isCheckedIn = attendee.status === 'Checked-In';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendees Ticket Details</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Event subtitle */}
        <View style={styles.eventBanner}>
          <Text style={styles.eventBannerTitle}>{eventTitle}</Text>
          <Text style={styles.eventBannerSub}>
            View ticket information and check-in status.
          </Text>
        </View>

        {/* Attendee Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendee Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>
              {attendee.firstName} {attendee.lastName}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone number:</Text>
            <Text style={styles.infoValue}>{attendee.phone || '—'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{attendee.email}</Text>
          </View>
        </View>

        {/* Ticket Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ticket Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Event:</Text>
            <Text style={styles.infoValue}>{eventTitle}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ticket Type:</Text>
            <Text style={styles.infoValue}>{attendee.ticketType || 'Regular'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ticket ID:</Text>
            <Text style={styles.infoValue}>
              {attendee.ticketId || `EVT-${(attendeeId || '').slice(-6).toUpperCase()}`}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Purchase Date:</Text>
            <Text style={styles.infoValue}>
              {attendee.createdAt
                ? new Date(attendee.createdAt).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric'
                })
                : '—'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <View style={styles.statusRow}>
              <Text style={[
                styles.statusValue,
                { color: isCheckedIn ? '#059669' : '#D97706' }
              ]}>
                {attendee.status || 'Pending'}
              </Text>
              {isCheckedIn && (
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
              )}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={handleSendSMS}
          >
            <Ionicons name="download-outline" size={16} color={PURPLE} />
            <Text style={styles.downloadBtnText}>Download Ticket</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.smsBtn}
            onPress={handleSendSMS}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#fff" />
            <Text style={styles.smsBtnText}>Send SMS</Text>
          </TouchableOpacity>
        </View>

        {/* Check In Button */}
        {!isCheckedIn && (
          <TouchableOpacity
            style={[styles.checkInBtn, checkingIn && styles.checkInBtnDisabled]}
            onPress={handleCheckIn}
            disabled={checkingIn}
          >
            {checkingIn ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.checkInBtnText}>Mark as Checked In</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {isCheckedIn && (
          <View style={styles.checkedInBanner}>
            <Ionicons name="checkmark-circle" size={20} color="#059669" />
            <Text style={styles.checkedInText}>Already Checked In</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },

  header: {
    backgroundColor: '#1A1A2E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },

  body: { flex: 1 },

  eventBanner: {
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
  },
  eventBannerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  eventBannerSub: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },

  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: DARK,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: { fontSize: 13, color: GRAY, flex: 1 },
  infoValue: { fontSize: 13, fontWeight: '600', color: DARK, flex: 1.5, textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#F3F4F6' },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusValue: { fontSize: 13, fontWeight: '700' },

  actions: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  downloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: PURPLE,
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  downloadBtnText: { color: PURPLE, fontWeight: '700', fontSize: 14 },
  smsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: PURPLE,
    borderRadius: 12,
    paddingVertical: 12,
  },
  smsBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  checkInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PURPLE,
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 16,
  },
  checkInBtnDisabled: { backgroundColor: '#C4B5FD' },
  checkInBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  checkedInBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 16,
  },
  checkedInText: { color: '#059669', fontWeight: '700', fontSize: 16 },

  errorText: { fontSize: 15, color: GRAY, marginBottom: 12 },
  goBackBtn: {
    backgroundColor: PURPLE,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  goBackText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});