import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
}

export function LoadingScreen({ message = 'טוען...', submessage }: LoadingScreenProps) {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Spin animation
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation on the outer ring
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.12,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [spin, pulse]);

  const rotation = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Animated.View style={[styles.outerRing, { transform: [{ scale: pulse }] }]}>
          <Animated.View style={[styles.spinnerWrap, { transform: [{ rotate: rotation }] }]}>
            <View style={styles.spinnerCircle}>
              <View style={styles.spinnerArc} />
            </View>
          </Animated.View>
          <View style={styles.iconCircle}>
            <Ionicons name="home-outline" size={28} color="#7B2FBE" />
          </View>
        </Animated.View>

        <Text style={styles.message}>{message}</Text>
        {submessage ? <Text style={styles.submessage}>{submessage}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: -8,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [bounce]);

  return (
    <View style={emptyStyles.container}>
      <Animated.View style={[emptyStyles.iconWrap, { transform: [{ translateY: bounce }] }]}>
        <View style={emptyStyles.outerCircle}>
          <View style={emptyStyles.innerCircle}>
            <Ionicons name={icon} size={40} color="#7B2FBE" />
          </View>
        </View>
      </Animated.View>

      <Text style={emptyStyles.title}>{title}</Text>
      <Text style={emptyStyles.subtitle}>{subtitle}</Text>
    </View>
  );
}

// ── Loading styles ───────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  outerRing: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerWrap: {
    position: 'absolute',
    width: 100,
    height: 100,
  },
  spinnerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#E9D5FF',
    borderTopColor: '#7B2FBE',
  },
  spinnerArc: {},
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  submessage: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});

// ── Empty state styles ───────────────────────────────────────
const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 14,
  },
  iconWrap: {
    marginBottom: 8,
  },
  outerCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#E9D5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 23,
  },
});
