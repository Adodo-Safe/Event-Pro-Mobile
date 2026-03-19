import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://eventpro-fxfv.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ========== TOKEN MANAGEMENT ==========

export const saveToken = async (token) => {
  try {
    await SecureStore.setItemAsync('authToken', token);
  } catch (error) {
    console.error('Failed to save token:', error);
  }
};

export const getToken = async () => {
  try {
    return await SecureStore.getItemAsync('authToken');
  } catch (error) {
    console.error('Failed to retrieve token:', error);
    return null;
  }
};

export const clearToken = async () => {
  try {
    await SecureStore.deleteItemAsync('authToken');
  } catch (error) {
    console.error('Failed to clear token:', error);
  }
};

// ========== REQUEST INTERCEPTOR ==========

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ========== RESPONSE INTERCEPTOR ==========

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await clearToken();
      // Optionally redirect to login here
    }
    return Promise.reject(error);
  }
);

// ========== AUTH ENDPOINTS ==========

export const signUp = (firstName, lastName, email, password) =>
  api.post('/auth/signup', {
    firstName,
    lastName,
    email,
    password,
  });

export const signUpOrganizer = (firstName, lastName, email, password) =>
  api.post('/auth/signup/organizer', {
    firstName,
    lastName,
    email,
    password,
  });

export const login = (email, password) =>
  api.post('/auth/login', {
    email,
    password,
  });

export const getProfile = () => api.get('/auth/profile');

export const updateProfile = (data) => api.put('/auth/profile', data);

export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email });

export const resetPassword = (token, newPassword) =>
  api.post(`/auth/reset-password/${token}`, { newPassword });

// ========== EVENT ENDPOINTS ==========

export const createEvent = (eventData) =>
  api.post('/events', eventData);

export const listEvents = () => api.get('/events');

export const getEventById = (id) => api.get(`/events/${id}`);

export const getMyEvents = () =>
  api.get('/events/organizer/my-events');

export const duplicateEvent = (id, data) =>
  api.post(`/events/${id}/duplicate`, data);

export const updateEvent = (id, data) =>
  api.put(`/events/${id}`, data);

export const deleteEvent = (id) =>
  api.delete(`/events/${id}`);

export const saveEvent = (eventId) =>
  api.post(`/events/${eventId}/save`);

export const unsaveEvent = (eventId) =>
  api.delete(`/events/${eventId}/save`);

// ========== ATTENDEE ENDPOINTS ==========

export const registerForEvent = (eventId, attendeeData) =>
  api.post(`/events/${eventId}/register`, attendeeData);

export const getAttendeeImportStatus = (eventId, importId) =>
  api.get(`/events/${eventId}/attendees/imports/${importId}`);

export const getAttendeeImportResult = (eventId, importId) =>
  api.get(`/events/${eventId}/attendees/imports/${importId}/result`);

export const downloadDuplicatesCSV = (eventId, importId) =>
  api.get(`/events/${eventId}/attendees/imports/${importId}/duplicates.csv`);

export const downloadImportTemplate = (eventId) =>
  api.get(`/events/${eventId}/attendees/imports/template`);

export const exportAttendanceCSV = (eventId) =>
  api.get(`/events/${eventId}/attendees/attendance.csv`);

export const exportAttendancePDF = (eventId) =>
  api.get(`/events/${eventId}/attendees/attendance.pdf`);

// ========== CHECK-IN ENDPOINTS ==========

export const getCheckInTemplate = (eventId) =>
  api.get(`/events/${eventId}/checkin/template`);

export const scanCheckIn = (eventId, data) =>
  api.post(`/events/${eventId}/checkin/scan`, data);

export const previewCheckIn = (eventId, data) =>
  api.post(`/events/${eventId}/checkin/preview`, data);

export const generateCheckInCodes = (eventId, data) =>
  api.post(`/events/${eventId}/checkin/generate`, data);

export const sendCheckInInstructions = (eventId, data) =>
  api.post(`/events/${eventId}/checkin/send`, data);

export const getCheckInSendStatus = (eventId, sendId) =>
  api.get(`/events/${eventId}/checkin/send/${sendId}`);

export const getCheckInSendResult = (eventId, sendId) =>
  api.get(`/events/${eventId}/checkin/send/${sendId}/result`);

// ========== ADMIN ENDPOINTS ==========

export const listOrganizers = () => api.get('/admin/organizers');

export const getOrganizerDetails = (id) =>
  api.get(`/admin/organizers/${id}`);

export const deleteOrganizer = (id) =>
  api.delete(`/admin/organizers/${id}`);

export const updateOrganizerStatus = (id, status) =>
  api.put(`/admin/organizers/${id}/status`, { status });

export const resetOrganizerPassword = (id, newPassword) =>
  api.put(`/admin/organizers/${id}/reset-password`, { newPassword });

export const getSmsConfig = () => api.get('/admin/sms/config');

export const testSms = (data) => api.post('/admin/sms/test', data);

export const getUsersSmsSettings = () =>
  api.get('/admin/sms/users');

// ========== DASHBOARD ENDPOINTS ==========

export const getDashboardStats = () => api.get('/dashboard/stats');

export const getOrganizerDashboardStats = () =>
  api.get('/organizer/dashboard/stats');

export const streamOrganizerDashboardStats = () =>
  api.get('/organizer/dashboard/stream');

export default api;