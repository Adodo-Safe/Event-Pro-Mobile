import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const PURPLE = '#6F00FF';
const PURPLE_LIGHT = '#F0E6FF';
const DARK = '#0F0F14';
const GRAY = '#6B7280';

export default function RoleSelectionScreen() {
  const { token, firstName } = useLocalSearchParams();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) {
      Alert.alert('Select a role', 'Please choose how you want to use EventPro.');
      return;
    }

    setLoading(true);
    try {
      // Get email saved during login/signup
      const email = await AsyncStorage.getItem('email');

      await AsyncStorage.multiSet([
        ['token', token || ''],
        ['role', selected],
        ['firstName', firstName || ''],
        ...(email ? [[`role_${email}`, selected]] : []),
      ]);

      if (selected === 'user') {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(tabs)/dashboard');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      key: 'user',
      label: 'ATTENDEE',
      title: 'I want to\nattend events',
      features: [
        'Browse & discover events',
        'Register & get tickets',
        'Scan QR for check-in',
        'Save favourite events',
      ],
    },
    {
      key: 'organizer',
      label: 'ORGANIZER',
      title: 'I want to\nhost events',
      features: [
        'Create & publish events',
        'Manage your attendees',
        'Handle check-ins',
        'Export reports & CSV',
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>EventPro</Text>
      </View>

      <View style={styles.body}>
        {/* Greeting */}
        <Text style={styles.stepLabel}>STEP 2 OF 2</Text>
        <Text style={styles.heading}>
          {firstName ? `${firstName}, you're` : "You're"}{'\n'}almost in.
        </Text>
        <Text style={styles.subText}>
          Choose your role. This shapes your entire experience.
        </Text>

        {/* Cards */}
        <View style={styles.cards}>
          {roles.map((role) => {
            const isSelected = selected === role.key;
            return (
              <TouchableOpacity
                key={role.key}
                style={[styles.card, isSelected && styles.cardActive]}
                onPress={() => setSelected(role.key)}
                activeOpacity={0.9}
              >
                <View style={[styles.cardStrip, isSelected && styles.cardStripActive]} />

                <View style={styles.cardInner}>
                  <View style={styles.cardTopRow}>
                    <Text style={[styles.roleLabel, isSelected && styles.roleLabelActive]}>
                      {role.label}
                    </Text>
                    <View style={[styles.radio, isSelected && styles.radioActive]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                  </View>

                  <Text style={[styles.cardTitle, isSelected && styles.cardTitleActive]}>
                    {role.title}
                  </Text>

                  <View style={[styles.divider, isSelected && styles.dividerActive]} />

                  <View style={styles.featureList}>
                    {role.features.map((f) => (
                      <View key={f} style={styles.featureRow}>
                        <View style={[styles.featureLine, isSelected && styles.featureLineActive]} />
                        <Text style={[styles.featureText, isSelected && styles.featureTextActive]}>
                          {f}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Button */}
        <TouchableOpacity
          style={[styles.btn, !selected && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={!selected || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>
              {selected
                ? `Continue as ${selected === 'user' ? 'Attendee' : 'Organizer'}`
                : 'Select a role to continue'}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footer}>
          You can update this later in your profile settings.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    backgroundColor: '#1A1A2E',
    alignItems: 'center',
    paddingVertical: 14,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
  },

  stepLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PURPLE,
    letterSpacing: 2,
    marginBottom: 10,
  },
  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: DARK,
    lineHeight: 36,
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: GRAY,
    lineHeight: 20,
    marginBottom: 24,
  },

  cards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },

  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardActive: {
    borderColor: PURPLE,
    elevation: 6,
    shadowOpacity: 0.12,
    shadowColor: PURPLE,
  },

  cardStrip: {
    height: 4,
    backgroundColor: '#E5E7EB',
  },
  cardStripActive: {
    backgroundColor: PURPLE,
  },

  cardInner: { padding: 16 },

  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: GRAY,
  },
  roleLabelActive: { color: PURPLE },

  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: { borderColor: PURPLE },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PURPLE,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: DARK,
    lineHeight: 22,
    marginBottom: 14,
  },
  cardTitleActive: { color: DARK },

  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  dividerActive: { backgroundColor: PURPLE_LIGHT },

  featureList: { gap: 6 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureLine: {
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#D1D5DB',
  },
  featureLineActive: { backgroundColor: PURPLE },
  featureText: { fontSize: 12, color: GRAY, flex: 1, lineHeight: 16 },
  featureTextActive: { color: '#374151', fontWeight: '500' },

  btn: {
    backgroundColor: PURPLE,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  btnDisabled: { backgroundColor: '#C4B5FD' },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
  },
});