import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://eventpro-fxfv.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const saveToken = async (token) => {
  try {
    await SecureStore.setItemAsync('authToken', token);
    await AsyncStorage.setItem('token', token);
  } catch (error) {
    console.error('Failed to save token:', error);
  }
};

export const signUp = (firstName, lastName, email, password) =>
  api.post('/auth/signup/user', {
    firstName,
    lastName,
    email,
    password,
  });

export default api;