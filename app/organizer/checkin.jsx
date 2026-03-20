import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

const BASE_URL = 'https://eventpro-fxfv.onrender.com/api';
const PURPLE = '#6F00FF';
const DARK = '#0F0F14';
const GRAY = '#6B7280';

const api = axios.create({ baseURL: BASE_URL });
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const OrganizerBottomNav = ({ active }) => {
  const tabs = [
    { name: 'Home', icon: 'home-outline', activeIcon: 'home', route: '/(tabs)/dashboard' },
    { name: 'Events', icon: 'calendar-outline', activeIcon: 'calendar', route: '/organizer/my-events' },
    { name: 'Reports', icon: 'bar-chart-outline', activeIcon: 'bar-chart', route: '/organizer/reports' },
    { name: 'Check-in', icon: 'qr-code-outline', activeIcon: 'qr-code', route: '/organizer/checkin' },
    { name: 'Account', icon: 'person-outline', activeIcon: 'person', route: '/attendee/profile' },
  ];
  return (
    <View style={navStyles.container}>
      {tabs.map((tab) => {
        const isActive = active === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={navStyles.tab}
            onPress={() => router.push(tab.route)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={22}
              color={isActive ? PURPLE : '#9CA3AF'}
            />
            <Text style={[navStyles.tabText, isActive && navStyles.tabTextActive]}>
              {tab.name}
            </Text>
            {isActive && <View style={navStyles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default function CheckIn() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [stats, setStats] = useState({ checkedIn: 0, total: 0 });

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await api.get('/events/organizer/my-events');
        const data = res.data?.events || res.data || [];
        const published = data.filter(e => e.status === 'published');
        setEvents(published.length > 0 ? published : data);
        if (data.length > 0) {
          setSelectedEvent(published.length > 0 ? published[0] : data[0]);
        }
      } catch {
        // silently fail
      } finally {
        setLoadingEvents(false);
      }
    };
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) loadStats();
  }, [selectedEvent]);

  const loadStats = async () => {
    try {
      const res = await api.get(
        `/events/${selectedEvent._id || selectedEvent.id}/attendees`
      );
      const attendees = res.data?.attendees || [];
      const checkedIn = attendees.filter(a =>
        ['checked_in', 'checked-in'].includes(a.status?.toLowerCase())
      ).length;
      setStats({ checkedIn, total: res.data?.pagination?.total || attendees.length });
    } catch {
      // silently fail
    }
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned || processing) return;
    setScanned(true);
    setProcessing(true);
    Vibration.vibrate(100);

    try {
      let code = data;
      try {
        const parsed = JSON.parse(data);
        code = parsed.eventId || data;
      } catch {
        code = data;
      }

      const eventId = selectedEvent?._id || selectedEvent?.id;
      const res = await api.post(`/events/${eventId}/checkin/scan`, { code });

      const attendee = res.data?.attendee;
      setResult({
        success: true,
        name: `${attendee?.firstName || ''} ${attendee?.lastName || ''}`.trim(),
        email: attendee?.email || '',
        ticketType: attendee?.ticketType || 'Regular',
        ticketId: `EVT-${(attendee?._id || code).slice(-6).toUpperCase()}`,
        message: res.data?.message || 'Check-in successful!',
      });

      // Update stats
      setStats(prev => ({ ...prev, checkedIn: prev.checkedIn + 1 }));
    } catch (error) {
      const msg = error.response?.data?.message || 'Invalid QR code. Please try again.';
      setResult({ success: false, message: msg });
    } finally {
      setProcessing(false);
    }
  };

  const handleScanAgain = () => {
    setScanned(false);
    setResult(null);
  };

  if (loadingEvents) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>QR Check-in</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PURPLE} />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
        <OrganizerBottomNav active="Check-in" />
      </SafeAreaView>
    );
  }

  if (!permission) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PURPLE} />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>QR Check-in</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.permissionContainer}>
          <View style={styles.permissionIconWrapper}>
            <Ionicons name="camera-outline" size={48} color={PURPLE} />
          </View>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            EventPro needs camera access to scan attendee QR codes for check-in.
          </Text>
          <TouchableOpacity
            style={styles.permissionBtn}
            onPress={requestPermission}
          >
            <Text style={styles.permissionBtnText}>Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
        <OrganizerBottomNav active="Check-in" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Check-in</Text>
        <TouchableOpacity onPress={() => setTorchOn(v => !v)}>
          <Ionicons
            name={torchOn ? 'flash' : 'flash-outline'}
            size={22}
            color={torchOn ? '#FCD34D' : '#fff'}
          />
        </TouchableOpacity>
      </View>

      {/* Event Selector */}
      <TouchableOpacity
        style={styles.eventSelector}
        onPress={() => setShowEventPicker(true)}
      >
        <View style={styles.eventSelectorLeft}>
          <Ionicons name="calendar-outline" size={16} color={PURPLE} />
          <View>
            <Text style={styles.eventSelectorLabel}>Scanning for</Text>
            <Text style={styles.eventSelectorName} numberOfLines={1}>
              {selectedEvent?.title || 'Select an event'}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-down" size={18} color={GRAY} />
      </TouchableOpacity>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.checkedIn}</Text>
          <Text style={styles.statLabel}>Checked In</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {stats.total > 0
              ? `${Math.round((stats.checkedIn / stats.total) * 100)}%`
              : '0%'}
          </Text>
          <Text style={styles.statLabel}>Progress</Text>
        </View>
      </View>

      {/* Camera / Result */}
      <View style={styles.cameraContainer}>
        {!scanned ? (
          <CameraView
            style={styles.camera}
            facing="back"
            enableTorch={torchOn}
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          >
            <View style={styles.overlay}>
              {/* Dark overlay corners */}
              <View style={styles.overlayTop} />
              <View style={styles.overlayMiddle}>
                <View style={styles.overlaySide} />
                {/* Scan Frame */}
                <View style={styles.scanFrame}>
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                  {/* Scan line animation placeholder */}
                  <View style={styles.scanLine} />
                </View>
                <View style={styles.overlaySide} />
              </View>
              <View style={styles.overlayBottom}>
                <Text style={styles.scanHint}>
                  Point camera at attendee's QR code
                </Text>
              </View>
            </View>
          </CameraView>
        ) : (
          <View style={styles.resultContainer}>
            {processing ? (
              <View style={styles.processingBox}>
                <ActivityIndicator size="large" color={PURPLE} />
                <Text style={styles.processingText}>Verifying QR code...</Text>
              </View>
            ) : result ? (
              <View style={styles.resultCard}>
                {/* Success / Error Icon */}
                <View style={[
                  styles.resultIconWrapper,
                  { backgroundColor: result.success ? '#D1FAE5' : '#FEE2E2' }
                ]}>
                  <Ionicons
                    name={result.success ? 'checkmark-circle' : 'close-circle'}
                    size={52}
                    color={result.success ? '#059669' : '#EF4444'}
                  />
                </View>

                <Text style={[
                  styles.resultStatus,
                  { color: result.success ? '#059669' : '#EF4444' }
                ]}>
                  {result.success ? 'Check-in Successful!' : 'Check-in Failed'}
                </Text>

                {result.success && (
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{result.name}</Text>
                    <Text style={styles.resultEmail}>{result.email}</Text>

                    <View style={styles.resultDetails}>
                      <View style={styles.resultDetailItem}>
                        <Text style={styles.resultDetailLabel}>Ticket ID</Text>
                        <Text style={styles.resultDetailValue}>{result.ticketId}</Text>
                      </View>
                      <View style={styles.resultDetailDivider} />
                      <View style={styles.resultDetailItem}>
                        <Text style={styles.resultDetailLabel}>Ticket Type</Text>
                        <Text style={styles.resultDetailValue}>{result.ticketType}</Text>
                      </View>
                    </View>
                  </View>
                )}

                {!result.success && (
                  <Text style={styles.resultErrorMsg}>{result.message}</Text>
                )}

                <TouchableOpacity
                  style={[
                    styles.scanAgainBtn,
                    { backgroundColor: result.success ? PURPLE : '#EF4444' }
                  ]}
                  onPress={handleScanAgain}
                >
                  <Ionicons name="qr-code-outline" size={18} color="#fff" />
                  <Text style={styles.scanAgainText}>
                    {result.success ? 'Scan Next Attendee' : 'Try Again'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}
      </View>

      {/* Event Picker Modal */}
      {showEventPicker && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBg}
            onPress={() => setShowEventPicker(false)}
          />
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Event</Text>
            {events.map(event => (
              <TouchableOpacity
                key={event._id || event.id}
                style={[
                  styles.modalOption,
                  (selectedEvent?._id || selectedEvent?.id) === (event._id || event.id)
                  && styles.modalOptionActive
                ]}
                onPress={() => {
                  setSelectedEvent(event);
                  setShowEventPicker(false);
                  handleScanAgain();
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  (selectedEvent?._id || selectedEvent?.id) === (event._id || event.id)
                  && styles.modalOptionTextActive
                ]}>
                  {event.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <OrganizerBottomNav active="Check-in" />
    </SafeAreaView>
  );
}

const navStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingBottom: 20,
    paddingTop: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
  },
  tab: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center', gap: 4,
    position: 'relative',
  },
  tabText: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  tabTextActive: { color: PURPLE },
  activeDot: {
    position: 'absolute', bottom: -6,
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: PURPLE,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F0F14' },
  loadingContainer: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', gap: 12,
  },
  loadingText: { color: '#fff', fontSize: 14 },

  header: {
    backgroundColor: '#1A1A2E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Event Selector
  eventSelector: {
    backgroundColor: '#1E1E2E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
    gap: 10,
  },
  eventSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  eventSelectorLabel: { fontSize: 11, color: '#9CA3AF' },
  eventSelectorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    maxWidth: 240,
  },

  // Stats Bar
  statsBar: {
    backgroundColor: '#1E1E2E',
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#2A2A3E' },

  // Camera
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },

  overlay: { flex: 1 },
  overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayMiddle: { flexDirection: 'row', height: 240 },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    paddingTop: 20,
  },

  scanFrame: {
    width: 240,
    height: 240,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: PURPLE,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: PURPLE,
    opacity: 0.8,
  },
  scanHint: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // Result
  resultContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  processingBox: {
    alignItems: 'center',
    gap: 16,
  },
  processingText: {
    fontSize: 16,
    color: DARK,
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  resultIconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultStatus: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  resultInfo: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultName: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK,
    marginBottom: 4,
  },
  resultEmail: {
    fontSize: 13,
    color: GRAY,
    marginBottom: 16,
  },
  resultDetails: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    width: '100%',
  },
  resultDetailItem: { flex: 1, alignItems: 'center' },
  resultDetailLabel: { fontSize: 11, color: GRAY, marginBottom: 4 },
  resultDetailValue: { fontSize: 14, fontWeight: '700', color: DARK },
  resultDetailDivider: { width: 1, backgroundColor: '#E5E7EB' },
  resultErrorMsg: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  scanAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: '100%',
    justifyContent: 'center',
  },
  scanAgainText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // Permission
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
    backgroundColor: '#F9FAFB',
  },
  permissionIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F0E6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: DARK,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    color: GRAY,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionBtn: {
    backgroundColor: PURPLE,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 36,
    marginTop: 8,
  },
  permissionBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // Modal
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  modalBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalBox: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 20, width: 280, elevation: 10,
  },
  modalTitle: {
    fontSize: 16, fontWeight: '800',
    color: DARK, marginBottom: 14,
  },
  modalOption: {
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 10, marginBottom: 6,
  },
  modalOptionActive: { backgroundColor: '#F0E6FF' },
  modalOptionText: { fontSize: 14, color: '#374151' },
  modalOptionTextActive: { color: PURPLE, fontWeight: '700' },
});