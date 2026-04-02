import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function AuthCallbackScreen() {
  const router = useRouter();

  // The deep link handler in useAuth.tsx processes the tokens.
  // This screen just shows a brief loading state then redirects home.
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/');
    }, 1500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#7B2FBE" />
        <Text style={styles.text}>מאמת את החשבון...</Text>
        <Text style={styles.subtext}>רגע, מחבר אותך</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  subtext: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
