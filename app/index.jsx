import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const SCREENS = [
  {
    label: 'Sign Up',
    route: '/auth/signup',
    hint: 'Open account creation screen',
  },
  {
    label: 'Create Event',
    route: '/events/create-event',
    hint: 'Open multi-step event form',
  },
  {
    label: 'Organizer Accounts',
    route: '/organizer',
    hint: 'Open organizer management table',
  },
];

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Event-Pro Screen Hub</Text>
      <Text style={styles.subtitle}>Tap a screen to open it.</Text>

      <View style={styles.linksContainer}>
        {SCREENS.map((screen) => (
          <Pressable
            key={screen.route}
            style={styles.linkCard}
            onPress={() => router.push(screen.route)}
          >
            <Text style={styles.linkTitle}>{screen.label}</Text>
            <Text style={styles.linkHint}>{screen.hint}</Text>
            <Text style={styles.linkRoute}>{screen.route}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 64,
  },
  title: {
    fontSize: 28,
    fontFamily: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'regular',
    color: '#6B7280',
    marginBottom: 28,
  },
  linksContainer: {
    gap: 14,
  },
  linkCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F9FAFB',
  },
  linkTitle: {
    fontSize: 17,
    fontFamily: 'semibold',
    color: '#111827',
    marginBottom: 4,
  },
  linkHint: {
    fontSize: 13,
    fontFamily: 'regular',
    color: '#4B5563',
    marginBottom: 8,
  },
  linkRoute: {
    fontSize: 12,
    fontFamily: 'regular',
    color: '#7C3AED',
  },
});
