import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
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

export default function Reports() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState({});

  const loadData = useCallback(async () => {
    try {
      const [eventsRes, statsRes] = await Promise.all([
        api.get('/events/organizer/my-events'),
        api.get('/organizer/dashboard/stats'),
      ]);
      setEvents(eventsRes.data?.events || eventsRes.data || []);
      setStats(statsRes.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleExportCSV = async (eventId, eventTitle) => {
    setDownloading(prev => ({ ...prev, [`csv_${eventId}`]: true }));
    try {
      await api.get(`/events/${eventId}/attendees/attendance.csv`);
      Alert.alert('Success', `CSV report for "${eventTitle}" has been exported.`);
    } catch {
      Alert.alert('Error', 'Could not export CSV. Please try again.');
    } finally {
      setDownloading(prev => ({ ...prev, [`csv_${eventId}`]: false }));
    }
  };

  const handleExportPDF = async (eventId, eventTitle) => {
    setDownloading(prev => ({ ...prev, [`pdf_${eventId}`]: true }));
    try {
      await api.get(`/events/${eventId}/attendees/attendance.pdf`);
      Alert.alert('Success', `PDF report for "${eventTitle}" has been exported.`);
    } catch {
      Alert.alert('Error', 'Could not export PDF. Please try again.');
    } finally {
      setDownloading(prev => ({ ...prev, [`pdf_${eventId}`]: false }));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reports</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PURPLE} />
        </View>
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
        <Text style={styles.headerTitle}>Reports</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PURPLE]} />
        }
      >
        {/* Page Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.pageTitle}>Reports</Text>
          <Text style={styles.pageSubtitle}>
            Export attendance reports for your events.
          </Text>
        </View>

        {/* Overall Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="calendar-outline" size={24} color={PURPLE} />
            <Text style={styles.statValue}>{stats?.totalEvents ?? events.length}</Text>
            <Text style={styles.statLabel}>Total Events</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people-outline" size={24} color="#059669" />
            <Text style={[styles.statValue, { color: '#059669' }]}>
              {stats?.totalAttendees ?? 0}
            </Text>
            <Text style={styles.statLabel}>Total Attendees</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#6F00FF" />
            <Text style={[styles.statValue, { color: PURPLE }]}>
              {stats?.checkedIn ?? 0}
            </Text>
            <Text style={styles.statLabel}>Checked In</Text>
          </View>
        </View>

        {/* Events Reports */}
        <Text style={styles.sectionTitle}>Event Reports</Text>

        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={40} color={PURPLE} />
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptySubtitle}>
              Create events to generate attendance reports.
            </Text>
          </View>
        ) : (
          events.map((event) => {
            const eventId = event._id || event.id;
            return (
              <View key={eventId} style={styles.reportCard}>
                {/* Event Info */}
                <View style={styles.reportCardHeader}>
                  <View style={styles.reportCardLeft}>
                    <Text style={styles.reportEventTitle} numberOfLines={1}>
                      {event.title}
                    </Text>
                    <Text style={styles.reportEventDate}>
                      {event.date
                        ? new Date(event.date).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })
                        : 'Date TBD'}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    {
                      backgroundColor: event.status === 'published'
                        ? '#D1FAE5' : '#FEF3C7'
                    }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: event.status === 'published' ? '#059669' : '#D97706' }
                    ]}>
                      {event.status || 'Draft'}
                    </Text>
                  </View>
                </View>

                {/* Attendee count */}
                <View style={styles.reportStats}>
                  <View style={styles.reportStatItem}>
                    <Ionicons name="people-outline" size={14} color={PURPLE} />
                    <Text style={styles.reportStatText}>
                      {event.expectedAttendees || 0} expected
                    </Text>
                  </View>
                </View>

                {/* Export Buttons */}
                <View style={styles.exportBtns}>
                  <TouchableOpacity
                    style={styles.csvBtn}
                    onPress={() => handleExportCSV(eventId, event.title)}
                    disabled={downloading[`csv_${eventId}`]}
                  >
                    {downloading[`csv_${eventId}`] ? (
                      <ActivityIndicator size="small" color={PURPLE} />
                    ) : (
                      <>
                        <Ionicons name="download-outline" size={15} color={PURPLE} />
                        <Text style={styles.csvBtnText}>Export CSV</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.pdfBtn}
                    onPress={() => handleExportPDF(eventId, event.title)}
                    disabled={downloading[`pdf_${eventId}`]}
                  >
                    {downloading[`pdf_${eventId}`] ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="document-outline" size={15} color="#fff" />
                        <Text style={styles.pdfBtnText}>Export PDF</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <OrganizerBottomNav active="Reports" />
    </SafeAreaView>
  );
}

const navStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    position: 'relative',
  },
  tabText: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  tabTextActive: { color: PURPLE },
  activeDot: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: PURPLE,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: '#1A1A2E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },

  body: { flex: 1 },

  titleBlock: { paddingHorizontal: 16, paddingTop: 20, marginBottom: 16 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: DARK },
  pageSubtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },

  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  statValue: { fontSize: 20, fontWeight: '800', color: DARK },
  statLabel: { fontSize: 11, color: '#9CA3AF', textAlign: 'center' },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: DARK,
    marginHorizontal: 16,
    marginBottom: 12,
  },

  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  reportCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  reportCardLeft: { flex: 1, marginRight: 8 },
  reportEventTitle: { fontSize: 15, fontWeight: '700', color: DARK, marginBottom: 4 },
  reportEventDate: { fontSize: 12, color: GRAY },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },

  reportStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reportStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reportStatText: { fontSize: 12, color: GRAY },

  exportBtns: { flexDirection: 'row', gap: 10 },
  csvBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: PURPLE,
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  csvBtnText: { color: PURPLE, fontWeight: '700', fontSize: 13 },
  pdfBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: PURPLE,
    borderRadius: 10,
    paddingVertical: 10,
  },
  pdfBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: DARK },
  emptySubtitle: { fontSize: 13, color: GRAY, textAlign: 'center', lineHeight: 20 },
});