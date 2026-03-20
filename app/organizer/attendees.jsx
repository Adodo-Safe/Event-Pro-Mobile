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
  ScrollView,
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

const getStatusStyle = (status) => {
  switch (status?.toLowerCase()) {
    case 'checked_in':
    case 'checked-in':
      return { bg: '#D1FAE5', text: '#059669', label: 'Checked-In' };
    case 'pending':
      return { bg: '#FEF3C7', text: '#D97706', label: 'Pending' };
    case 'cancelled':
      return { bg: '#FEE2E2', text: '#EF4444', label: 'Cancelled' };
    case 'registered':
    default:
      return { bg: PURPLE_LIGHT, text: PURPLE, label: 'Registered' };
  }
};

export default function Attendees() {
  const { eventId, eventTitle } = useLocalSearchParams();
  const [firstName, setFirstName] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ticketFilter, setTicketFilter] = useState('All Ticket Types');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [currentPage, setCurrentPage] = useState(1);

  const ticketOptions = ['All Ticket Types', 'VIP', 'Regular'];
  const statusOptions = ['All Statuses', 'Checked-In', 'Pending', 'Registered', 'Cancelled'];

  const loadAttendees = useCallback(async (page = 1) => {
    try {
      const storedName = await AsyncStorage.getItem('firstName');
      if (storedName) setFirstName(storedName);

      const res = await api.get(`/events/${eventId}/attendees`, {
        params: { page, limit: 24 }
      });

      const data = res.data?.attendees || [];
      const paginationData = res.data?.pagination || {};

      setAttendees(data);
      setFiltered(data);
      setPagination({
        page: paginationData.page || page,
        total: paginationData.total || 0,
        pages: paginationData.pages || 1,
      });
    } catch {
      setAttendees([]);
      setFiltered([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventId]);

  useEffect(() => { loadAttendees(1); }, [loadAttendees]);

  useEffect(() => {
    let result = [...attendees];
    if (ticketFilter !== 'All Ticket Types') {
      result = result.filter(a => a.ticketType === ticketFilter);
    }
    if (statusFilter !== 'All Statuses') {
      result = result.filter(a =>
        getStatusStyle(a.status).label === statusFilter
      );
    }
    setFiltered(result);
  }, [ticketFilter, statusFilter, attendees]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAttendees(currentPage);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    loadAttendees(page);
  };

  const checkedIn = attendees.filter(a =>
    ['checked_in', 'checked-in'].includes(a.status?.toLowerCase())
  ).length;

  const pending = attendees.filter(a =>
    a.status?.toLowerCase() === 'pending'
  ).length;

  const generateTicketId = (id) => {
    return `EVT-${(id || '').slice(-6).toUpperCase()}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>EventPro</Text>
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
          <View style={styles.hamburger}>
            <View style={styles.bar} />
            <View style={[styles.bar, { width: 16 }]} />
            <View style={styles.bar} />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EventPro</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="search-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <View style={styles.notifWrapper}>
              <Ionicons name="notifications-outline" size={20} color={PURPLE_LIGHT} />
              <View style={styles.notifDot} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PURPLE]} />
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Welcome */}
        <View style={styles.welcomeRow}>
          <Text style={styles.welcomeText}>
            Welcome, <Text style={styles.welcomeName}>{firstName}</Text>
          </Text>
          <View style={styles.welcomeIcons}>
            <TouchableOpacity>
              <Ionicons name="search-outline" size={20} color={DARK} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="notifications-outline" size={20} color={PURPLE} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.pageTitle}>Attendees</Text>
          <Text style={styles.eventName}>{eventTitle}</Text>
          <Text style={styles.pageSubtitle}>
            Manage all events attendees and check-in status.
          </Text>
        </View>

        {/* Filters + Actions */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowTicketModal(true)}
          >
            <Text style={styles.filterText}>{ticketFilter} ▾</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowStatusModal(true)}
          >
            <Text style={styles.filterText}>{statusFilter} ▾</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Add Attendees</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportBtn}>
            <Ionicons name="download-outline" size={14} color="#fff" />
            <Text style={styles.exportBtnText}>Export CSV</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Text style={styles.statItem}>
            <Text style={styles.statBold}>Total Attendees: </Text>
            <Text style={styles.statNumber}>{pagination.total || attendees.length}</Text>
          </Text>
          <Text style={styles.statItem}>
            <Text style={[styles.statBold, { color: '#059669' }]}>Checked-In: </Text>
            <Text style={[styles.statNumber, { color: '#059669' }]}>{checkedIn}</Text>
          </Text>
          <Text style={styles.statItem}>
            <Text style={[styles.statBold, { color: '#D97706' }]}>Pending: </Text>
            <Text style={[styles.statNumber, { color: '#D97706' }]}>{pending}</Text>
          </Text>
        </View>

        {/* Horizontal Scrollable Table */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={40} color={PURPLE} />
            <Text style={styles.emptyTitle}>No attendees yet</Text>
            <Text style={styles.emptySubtitle}>
              Attendees who register for this event will appear here.
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.colHead, styles.colName]}>Name</Text>
                <Text style={[styles.colHead, styles.colEmail]}>Email</Text>
                <Text style={[styles.colHead, styles.colPhone]}>Phone</Text>
                <Text style={[styles.colHead, styles.colTicket]}>Ticket Type</Text>
                <Text style={[styles.colHead, styles.colTicketId]}>Ticket ID</Text>
                <Text style={[styles.colHead, styles.colStatus]}>Status</Text>
                <Text style={[styles.colHead, styles.colAction]}>Action</Text>
              </View>

              {/* Table Rows */}
              {filtered.map((item, index) => {
                const statusStyle = getStatusStyle(item.status);
                return (
                  <View
                    key={item._id}
                    style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}
                  >
                    <Text style={[styles.cell, styles.colName]} numberOfLines={1}>
                      {item.firstName} {item.lastName}
                    </Text>
                    <Text style={[styles.cell, styles.colEmail]} numberOfLines={1}>
                      {item.email}
                    </Text>
                    <Text style={[styles.cell, styles.colPhone]} numberOfLines={1}>
                      {item.phone || '—'}
                    </Text>
                    <Text style={[styles.cell, styles.colTicket]} numberOfLines={1}>
                      {item.ticketType || 'Regular'}
                    </Text>
                    <Text style={[styles.cell, styles.colTicketId]} numberOfLines={1}>
                      {generateTicketId(item._id)}
                    </Text>
                    <View style={[styles.colStatus, { justifyContent: 'center' }]}>
                      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>
                          {statusStyle.label}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.colAction, { justifyContent: 'center', alignItems: 'center' }]}>
                      <TouchableOpacity
                        onPress={() => router.push({
                          pathname: '/organizer/attendee-detail',
                          params: {
                            attendeeId: item._id,
                            eventId,
                            eventTitle,
                          }
                        })}
                      >
                        <Ionicons
                          name={
                            statusStyle.label === 'Checked-In'
                              ? 'checkbox-outline'
                              : 'eye-outline'
                          }
                          size={18}
                          color={GRAY}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <View style={styles.pagination}>
            <Text style={styles.paginationInfo}>
              Showing {((currentPage - 1) * 24) + 1}-
              {Math.min(currentPage * 24, pagination.total)} of {pagination.total} attendees
            </Text>
            <View style={styles.paginationBtns}>
              <TouchableOpacity
                style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                onPress={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? GRAY : DARK} />
              </TouchableOpacity>

              {Array.from({ length: Math.min(pagination.pages, 4) }, (_, i) => i + 1).map(page => (
                <TouchableOpacity
                  key={page}
                  style={[styles.pageBtn, currentPage === page && styles.pageBtnActive]}
                  onPress={() => handlePageChange(page)}
                >
                  <Text style={[
                    styles.pageBtnText,
                    currentPage === page && styles.pageBtnTextActive
                  ]}>
                    {page}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[styles.pageBtn, currentPage === pagination.pages && styles.pageBtnDisabled]}
                onPress={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.pages}
              >
                <Ionicons name="chevron-forward" size={16} color={currentPage === pagination.pages ? GRAY : DARK} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Filter Modals */}
      {showTicketModal && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBg} onPress={() => setShowTicketModal(false)} />
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Ticket Type</Text>
            {ticketOptions.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.modalOption, ticketFilter === opt && styles.modalOptionActive]}
                onPress={() => { setTicketFilter(opt); setShowTicketModal(false); }}
              >
                <Text style={[styles.modalOptionText, ticketFilter === opt && styles.modalOptionTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {showStatusModal && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBg} onPress={() => setShowStatusModal(false)} />
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Status</Text>
            {statusOptions.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.modalOption, statusFilter === opt && styles.modalOptionActive]}
                onPress={() => { setStatusFilter(opt); setShowStatusModal(false); }}
              >
                <Text style={[styles.modalOptionText, statusFilter === opt && styles.modalOptionTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <OrganizerBottomNav active="Events" />
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
  hamburger: { gap: 4 },
  bar: { width: 22, height: 2, backgroundColor: '#fff', borderRadius: 2 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
  headerIcons: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 6 },
  notifWrapper: { position: 'relative' },
  notifDot: {
    position: 'absolute', top: 0, right: 0,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: PURPLE,
    borderWidth: 1.5, borderColor: '#1A1A2E',
  },

  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  welcomeText: { fontSize: 15, color: GRAY },
  welcomeName: { fontWeight: '700', color: DARK },
  welcomeIcons: { flexDirection: 'row', gap: 12 },

  titleBlock: { paddingHorizontal: 16, marginBottom: 12 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: DARK },
  eventName: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 2 },
  pageSubtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },

  filterRow: { marginBottom: 12 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterBtn: {
    borderWidth: 1, borderColor: '#D1D5DB',
    borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: 7, backgroundColor: '#fff',
  },
  filterText: { fontSize: 13, color: '#374151' },
  addBtn: {
    backgroundColor: '#fff', borderWidth: 1.5,
    borderColor: PURPLE, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  addBtnText: { color: PURPLE, fontSize: 13, fontWeight: '600' },
  exportBtn: {
    backgroundColor: PURPLE, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 7,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  exportBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    marginBottom: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  statItem: { fontSize: 12 },
  statBold: { fontWeight: '700', color: DARK },
  statNumber: { fontWeight: '800' },

  // Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  tableRowAlt: { backgroundColor: '#FAFAFA' },

  colHead: { fontSize: 12, fontWeight: '700', color: GRAY, textTransform: 'uppercase' },
  cell: { fontSize: 13, color: DARK },

  colName: { width: 130 },
  colEmail: { width: 170 },
  colPhone: { width: 140 },
  colTicket: { width: 100 },
  colTicketId: { width: 100 },
  colStatus: { width: 110, flexDirection: 'row' },
  colAction: { width: 60, flexDirection: 'row' },

  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  // Pagination
  pagination: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  paginationInfo: { fontSize: 12, color: GRAY, marginBottom: 10 },
  paginationBtns: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pageBtn: {
    width: 32, height: 32, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  pageBtnActive: { backgroundColor: PURPLE },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 13, fontWeight: '700', color: DARK },
  pageBtnTextActive: { color: '#fff' },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: DARK },
  emptySubtitle: { fontSize: 13, color: GRAY, textAlign: 'center', lineHeight: 20 },

  // Modal
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  modalBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalBox: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: 20, width: 260, elevation: 10,
  },
  modalTitle: { fontSize: 15, fontWeight: '700', color: DARK, marginBottom: 12 },
  modalOption: {
    paddingVertical: 11, paddingHorizontal: 12,
    borderRadius: 8, marginBottom: 4,
  },
  modalOptionActive: { backgroundColor: PURPLE_LIGHT },
  modalOptionText: { fontSize: 14, color: '#374151' },
  modalOptionTextActive: { color: PURPLE, fontWeight: '700' },
});