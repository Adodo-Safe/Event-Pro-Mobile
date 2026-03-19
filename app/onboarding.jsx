import { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Text,
  Pressable,
  Dimensions,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const ONBOARDING_SLIDES = [
  {
    id: '1',
    title: 'Welcome To EventPro',
    description: 'Seamlessly organize and manage your events in one place.',
    image: require('../assets/images/onboarding-people.png'),
  },
  {
    id: '2',
    title: 'Check-In Made Easy',
    description: 'Quick and seamless check-in experience for your attendees.',
    image: require('../assets/images/onboarding-qr.png'),
  },
  {
    id: '3',
    title: 'Monitor In Real Time',
    description: 'Track event metrics and attendee analytics in real-time.',
    image: require('../assets/images/onboarding-metrics.png'),
  },
  {
    id: '4',
    title: "Let's Get Started",
    description: 'Create an account to begin organizing amazing events.',
    image: require('../assets/images/signup-image.png'),
  },
];

function OnboardingSlide({ slide }) {
  return (
    <View style={styles.slide}>
      <Image source={slide.image} style={styles.slideImage} resizeMode="contain" />
      <Text style={styles.slideTitle}>{slide.title}</Text>
      <Text style={styles.slideDescription}>{slide.description}</Text>
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    } else {
      // Navigate to screen hub so user can open any screen.
      router.push('/');
    }
  };

  const handleSkip = () => {
    router.push('/');
  };

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header with Skip button */}
      <View style={styles.header}>
        <Pressable onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Carousel */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        renderItem={({ item }) => <OnboardingSlide slide={item} />}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={(event) => {
          const offsetX = event.nativeEvent.contentOffset.x;
          const index = Math.round(offsetX / width);
          setCurrentIndex(index);
        }}
      />

      {/* Dots Indicator */}
      <View style={styles.dotsContainer}>
        {ONBOARDING_SLIDES.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index === currentIndex && styles.activeDot]}
          />
        ))}
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <Pressable
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {isLastSlide ? 'Continue' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 8,
    paddingHorizontal: 24,
    paddingBottom: 0,
    alignItems: 'flex-end',
  },
  skipText: {
    fontSize: 16,
    fontFamily: 'regular',
    color: '#161616',
  },
  slide: {
    width,
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  slideImage: {
    width: width - 48,
    height: width - 48,
    marginBottom: 32,
  },
  slideTitle: {
    fontSize: 24,
    fontFamily: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  slideDescription: {
    fontSize: 14,
    fontFamily: 'regular',
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 32,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  activeDot: {
    backgroundColor: '#7C3AED',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  nextButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'semibold',
    color: '#FFFFFF',
  },
});
