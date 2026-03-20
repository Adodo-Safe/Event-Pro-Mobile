import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
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

export default function MyEvents() {
  const [firstName, setFirstName] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      const storedName = await AsyncStorage.getItem('firstName');
      if (storedName) setFirstName(storedName);

      const res = await api.get('/events/organizer/my-events');
      setEvents(res.data?.events || res.data || []);
    } catch (error) {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'published': return { bg: '#D1FAE5', text: '#059669' };
      case 'draft': return { bg: '#FEF3C7', text: '#D97706' };
      case 'ended': return { bg: '#F3F4F6', text: GRAY };
      default: return { bg: PURPLE_LIGHT, text: PURPLE };
    }
  };

  const renderEvent = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => router.push({
          pathname: '/organizer/attendees',
          params: {
            eventId: item._id || item.id,
            eventTitle: item.title,
          }
        })}
        activeOpacity={0.85}
      >
        {/* Color Strip */}
        <View style={styles.cardStrip} />

        <View style={styles.cardContent}>
          {/* Title + Status */}
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
              <Text style={[styles.statusText, { color: statusColor.text }]}>
                {item.status || 'Draft'}
              </Text>
            </View>
          </View>

          {/* Date */}
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={13} color={GRAY} />
            <Text style={styles.metaText}>{formatDate(item.date)}</Text>
          </View>

          {/* Location */}
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color={GRAY} />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.location || 'Venue TBD'}
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.attendeeCount}>
              <Ionicons name="people-outline" size={13} color={PURPLE} />
              <Text style={styles.attendeeText}>
                {item.expectedAttendees || 0} expected
              </Text>
            </View>
            <View style={styles.manageBtn}>
              <Text style={styles.manageBtnText}>Manage</Text>
              <Ionicons name="arrow-forward" size={13} color={PURPLE} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Events</Text>
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
        <Text style={styles.headerTitle}>My Events</Text>
        <TouchableOpacity onPress={() => router.push('/organizer/create-event')}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item._id || item.id}
        renderItem={renderEvent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PURPLE]} />
        }
        contentContainerStyle={{ paddingBottom: 80 }}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.welcomeRow}>
              <Text style={styles.greeting}>Welcome, {firstName}</Text>
            </View>
            <Text style={styles.pageTitle}>My Events</Text>
            <Text style={styles.pageSubtitle}>
              Manage your events and attendees.
            </Text>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{events.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#059669' }]}>
                  {events.filter(e => e.status === 'published').length}
                </Text>
                <Text style={styles.statLabel}>Published</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#D97706' }]}>
                  {events.filter(e => e.status === 'draft').length}
                </Text>
                <Text style={styles.statLabel}>Draft</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: GRAY }]}>
                  {events.filter(e => e.status === 'ended').length}
                </Text>
                <Text style={styles.statLabel}>Ended</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="calendar-outline" size={32} color={PURPLE} />
            </View>
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first event to get started.
            </Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => router.push('/organizer/create-event')}
            >
              <Text style={styles.createBtnText}>+ Create Event</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <OrganizerBottomNav active="Events" />
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
  tabText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  tabTextActive: {
    color: PURPLE,
  },
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
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },

  header: {
    backgroundColor: '#1A1A2E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  listHeader: { paddingHorizontal: 16 },

  welcomeRow: {
    marginTop: 20,
    marginBottom: 4,
  },
  greeting: { fontSize: 13, color: GRAY },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: DARK,
    marginTop: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
    marginBottom: 16,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: DARK,
    marginBottom: 4,
  },
  statLabel: { fontSize: 11, color: '#9CA3AF' },
  statDivider: { width: 1, backgroundColor: '#F3F4F6' },

  // Event Card
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardStrip: { width: 4, backgroundColor: PURPLE },
  cardContent: { flex: 1, padding: 14 },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaText: { fontSize: 12, color: GRAY },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  attendeeCount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  attendeeText: { fontSize: 12, color: PURPLE, fontWeight: '600' },
  manageBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  manageBtnText: { fontSize: 12, color: PURPLE, fontWeight: '700' },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: PURPLE_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: GRAY,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createBtn: {
    backgroundColor: PURPLE,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});