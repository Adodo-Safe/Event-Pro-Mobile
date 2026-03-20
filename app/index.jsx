import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Animated, View, Image, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const splashScreens = [
  {
    image: require('../assets/images/splash1.png'),
    title: 'Welcome To EventPro',
    description: 'Create, manage, and track attendees seamlessly.',
  },
  {
    image: require('../assets/images/splash2.png'),
    title: 'Check-In Made Easy',
    description: 'Scan QR codes and verify attendees instantly.',
  },
  {
    image: require('../assets/images/splash3.png'),
    title: 'Monitor In Real Time',
    description: 'Never miss a check-in. Track every attendee live.',
  },
  {
    image: require('../assets/images/splash4.png'),
    title: 'Let’s Get Started',
    description: 'Your event journey begins here. Let’s make it count.',
    final: true,
  },
];

export default function Index() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentIndex < splashScreens.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [currentIndex]);

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < splashScreens.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      router.replace('/auth/login');
    }
  };

  const handleSkip = () => setCurrentIndex(splashScreens.length - 1);
  const handleSignup = () => router.replace('/auth/signup');
  const handleLogin = () => router.replace('/auth/login');

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.topRightButton} onPress={handleSkip}>
        <Text style={styles.topRightText}>Skip</Text>
      </TouchableOpacity>

      <Animated.Image
        source={splashScreens[currentIndex].image}
        style={[styles.image, { opacity: fadeAnim }]}
        resizeMode="contain"
      />
      <Text style={styles.title}>{splashScreens[currentIndex].title}</Text>
      <Text style={styles.description}>{splashScreens[currentIndex].description}</Text>

      <View style={styles.dotsContainer}>
        {splashScreens.map((_, i) => (
          <View key={i} style={[styles.dot, currentIndex === i && styles.activeDot]} />
        ))}
      </View>

      {splashScreens[currentIndex].final ? (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSignup}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleLogin}>
            <Text style={styles.secondaryText}>Log In</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 20 },
  topRightButton: { position: 'absolute', top: 40, right: 20 },
  topRightText: { fontSize: 16, color: '#6200EE', fontWeight: '600' },
  image: { width: 250, height: 250, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  description: { fontSize: 16, textAlign: 'center', color: '#555', marginBottom: 20 },
  dotsContainer: { flexDirection: 'row', marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ccc', marginHorizontal: 4 },
  activeDot: { backgroundColor: '#000' },
  buttonRow: { flexDirection: 'row', gap: 16, marginTop: 20 },
  primaryButton: { backgroundColor: '#6200EE', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  secondaryButton: { borderColor: '#6200EE', borderWidth: 2, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryText: { color: '#6200EE', fontSize: 16, fontWeight: '600' },
});