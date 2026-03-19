import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

const BASE_URL = 'https://eventpro-fxfv.onrender.com/api';
const PURPLE = '#6F00FF';
const PURPLE_LIGHT = '#F0E6FF';
const DARK = '#0F0F14';
const GRAY = '#6B7280';
const { width } = Dimensions.get('window');

const api = axios.create({ baseURL: BASE_URL });
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const BottomNav = ({ active }) => {
  const tabs = [
    { name: 'Home', icon: 'home-outline', activeIcon: 'home', route: '/(tabs)/home' },
    { name: 'My Tickets', icon: 'ticket-outline', activeIcon: 'ticket', route: '/attendee/my-tickets' },
    { name: 'Profile', icon: 'person-outline', activeIcon: 'person', route: '/attendee/profile' },
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
              color={isActive ? PURPLE : GRAY}
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

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);

  const loadTickets = useCallback(async () => {
    try {
      const storedName = await AsyncStorage.getItem('firstName');
      if (storedName) setFirstName(storedName);

      const registered = await AsyncStorage.getItem('registeredEvents');
      const registeredList = registered ? JSON.parse(registered) : [];

      if (registeredList.length === 0) {
        setTickets([]);
        return;
      }

      const eventPromises = registeredList.map((id) =>
        api.get(`/events/${id}`).then((res) => res.data?.event || res.data).catch(() => null)
      );

      const events = await Promise.all(eventPromises);
      const validEvents = events.filter((e) => e !== null);
      setTickets(validEvents);
    } catch (error) {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTickets();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getQRValue = (event) => {
    return JSON.stringify({
      eventId: event._id || event.id,
      eventTitle: event.title,
      email: '',
    });
  };

  const handleShowQR = (ticket) => {
    setSelectedTicket(ticket);
    setShowQRModal(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Tickets</Text>
          <View style={{ width: 36 }} />
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Tickets</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PURPLE]} />
        }
      >
        {/* Welcome */}
        <View style={styles.welcomeBlock}>
          <Text style={styles.welcomeTitle}>
            {firstName ? `${firstName}'s Tickets` : 'My Tickets'}
          </Text>
          <Text style={styles.welcomeSubtitle}>
            {tickets.length} event{tickets.length !== 1 ? 's' : ''} registered
          </Text>
        </View>

        {/* Empty State */}
        {tickets.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="ticket-outline" size={32} color={PURPLE} />
            </View>
            <Text style={styles.emptyTitle}>No tickets yet</Text>
            <Text style={styles.emptySubtitle}>
              Events you register for will appear here with your QR check-in code.
            </Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => router.replace('/(tabs)/home')}
            >
              <Text style={styles.browseBtnText}>Browse Events</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ticketsList}>
            {tickets.map((ticket) => (
              <View key={ticket._id || ticket.id} style={styles.ticketCard}>

                {/* Ticket Top Strip */}
                <View style={styles.ticketStrip}>
                  <View style={styles.stripLeft}>
                    <Text style={styles.stripLabel}>EVENTPRO TICKET</Text>
                    <Text style={styles.stripStatus}>
                      {ticket.status?.toUpperCase() || 'REGISTERED'}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: ticket.status === 'published' ? '#10B981' : PURPLE }
                  ]} />
                </View>

                {/* Ticket Content */}
                <View style={styles.ticketContent}>
                  <Text style={styles.ticketTitle} numberOfLines={2}>
                    {ticket.title}
                  </Text>

                  <View style={styles.ticketMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={14} color={PURPLE} />
                      <Text style={styles.metaText}>{formatDate(ticket.date)}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={14} color={PURPLE} />
                      <Text style={styles.metaText}>{formatTime(ticket.date)}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="location-outline" size={14} color={PURPLE} />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {ticket.location || 'Venue TBD'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Perforated Divider */}
                <View style={styles.perforated}>
                  <View style={styles.perfCircleLeft} />
                  <View style={styles.perfLine} />
                  <View style={styles.perfCircleRight} />
                </View>

                {/* QR Section */}
                <View style={styles.ticketBottom}>
                  <View style={styles.qrPreview}>
                    <QRCode
                      value={getQRValue(ticket)}
                      size={64}
                      color={DARK}
                      backgroundColor="#fff"
                    />
                  </View>
                  <View style={styles.qrInfo}>
                    <Text style={styles.qrLabel}>Check-in QR Code</Text>
                    <Text style={styles.qrSub}>
                      Show this at the entrance to check in instantly.
                    </Text>
                    <TouchableOpacity
                      style={styles.viewQRBtn}
                      onPress={() => handleShowQR(ticket)}
                    >
                      <Text style={styles.viewQRText}>View Full QR</Text>
                      <Ionicons name="expand-outline" size={14} color={PURPLE} />
                    </TouchableOpacity>
                  </View>
                </View>

              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav active="My Tickets" />

      {/* Full Screen QR Modal */}
      <Modal
        visible={showQRModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.qrModalOverlay}>
          <View style={styles.qrModalBox}>
            <TouchableOpacity
              style={styles.qrModalClose}
              onPress={() => setShowQRModal(false)}
            >
              <Ionicons name="close" size={24} color={DARK} />
            </TouchableOpacity>

            {selectedTicket && (
              <>
                <Text style={styles.qrModalTitle}>{selectedTicket.title}</Text>
                <Text style={styles.qrModalDate}>
                  {formatDate(selectedTicket.date)} · {formatTime(selectedTicket.date)}
                </Text>
                <Text style={styles.qrModalLocation}>
                  {selectedTicket.location || 'Venue TBD'}
                </Text>

                <View style={styles.qrModalCode}>
                  <QRCode
                    value={getQRValue(selectedTicket)}
                    size={width * 0.6}
                    color={DARK}
                    backgroundColor="#fff"
                  />
                </View>

                <Text style={styles.qrModalHint}>
                  Show this QR code at the entrance
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>

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
    color: GRAY,
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
  backBtn: { padding: 4 },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  body: { flex: 1 },

  welcomeBlock: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: DARK,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: GRAY,
  },

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
  browseBtn: {
    backgroundColor: PURPLE,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  browseBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  ticketsList: {
    paddingHorizontal: 16,
    gap: 16,
  },

  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  ticketStrip: {
    backgroundColor: DARK,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  stripLeft: { gap: 2 },
  stripLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  stripStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  ticketContent: {
    padding: 16,
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK,
    marginBottom: 12,
    lineHeight: 24,
  },
  ticketMeta: { gap: 6 },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    color: GRAY,
    flex: 1,
  },

  perforated: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  perfCircleLeft: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    marginLeft: -10,
  },
  perfLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  perfCircleRight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    marginRight: -10,
  },

  ticketBottom: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
    alignItems: 'center',
  },
  qrPreview: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  qrInfo: { flex: 1 },
  qrLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: DARK,
    marginBottom: 4,
  },
  qrSub: {
    fontSize: 11,
    color: GRAY,
    lineHeight: 16,
    marginBottom: 8,
  },
  viewQRBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewQRText: {
    fontSize: 13,
    color: PURPLE,
    fontWeight: '700',
  },

  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  qrModalBox: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    alignItems: 'center',
  },
  qrModalClose: {
    alignSelf: 'flex-end',
    padding: 4,
    marginBottom: 8,
  },
  qrModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK,
    textAlign: 'center',
    marginBottom: 6,
  },
  qrModalDate: {
    fontSize: 13,
    color: GRAY,
    marginBottom: 4,
  },
  qrModalLocation: {
    fontSize: 13,
    color: GRAY,
    marginBottom: 24,
  },
  qrModalCode: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  qrModalHint: {
    fontSize: 13,
    color: GRAY,
    textAlign: 'center',
  },
});