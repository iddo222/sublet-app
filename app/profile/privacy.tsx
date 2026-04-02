import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

interface PrivacyOption {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const OPTIONS: PrivacyOption[] = [
  {
    key: 'showPhone',
    icon: 'call-outline',
    title: 'הצגת מספר טלפון',
    description: 'אפשר למשתמשים אחרים לראות את מספר הטלפון שלך',
  },
  {
    key: 'showEmail',
    icon: 'mail-outline',
    title: 'הצגת אימייל',
    description: 'אפשר למשתמשים אחרים לראות את כתובת האימייל שלך',
  },
  {
    key: 'showProfile',
    icon: 'person-outline',
    title: 'פרופיל ציבורי',
    description: 'הפרופיל שלך גלוי למשתמשים אחרים',
  },
  {
    key: 'notifications',
    icon: 'notifications-outline',
    title: 'התראות',
    description: 'קבל התראות על הודעות חדשות וסאבלטים שמעניינים אותך',
  },
];

export default function PrivacyScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<Record<string, boolean>>({
    showPhone: false,
    showEmail: false,
    showProfile: true,
    notifications: true,
  });

  const toggle = (key: string) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-forward" size={24} color="#111" />
        </Pressable>
        <Text style={s.headerTitle}>פרטיות</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={s.flex} contentContainerStyle={s.scroll}>
        <View style={s.infoCard}>
          <View style={s.infoRow}>
            <Ionicons name="shield-checkmark" size={20} color="#2563EB" />
            <Text style={s.infoTitle}>הפרטיות שלך חשובה לנו</Text>
          </View>
          <Text style={s.infoText}>
            אנחנו לא משתפים את המידע שלך עם גורמים חיצוניים. המידע משמש רק לצורך חיבור בין דיירים למשכירים.
          </Text>
        </View>

        <View style={s.card}>
          {OPTIONS.map((opt, i) => (
            <View key={opt.key} style={[s.row, i < OPTIONS.length - 1 && s.rowBorder]}>
              <View style={s.rowRight}>
                <View style={s.iconCircle}>
                  <Ionicons name={opt.icon} size={20} color="#7B2FBE" />
                </View>
                <View style={s.rowText}>
                  <Text style={s.rowTitle}>{opt.title}</Text>
                  <Text style={s.rowDesc}>{opt.description}</Text>
                </View>
              </View>
              <Switch
                value={settings[opt.key]}
                onValueChange={() => toggle(opt.key)}
                trackColor={{ false: '#D1D5DB', true: '#C4B5FD' }}
                thumbColor={settings[opt.key] ? '#7B2FBE' : '#F3F4F6'}
              />
            </View>
          ))}
        </View>

        <Text style={s.footer}>
          ההגדרות נשמרות לסשן הנוכחי בלבד
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111' },
  infoCard: {
    marginTop: 20, backgroundColor: '#DBEAFE', borderRadius: 16,
    paddingHorizontal: 18, paddingVertical: 16, marginBottom: 20,
  },
  infoRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoTitle: { fontSize: 16, fontWeight: '700', color: '#1E40AF' },
  infoText: { fontSize: 14, color: '#1E40AF', textAlign: 'right', lineHeight: 22 },
  card: {
    backgroundColor: '#FFF', borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  row: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 18,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowRight: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, flex: 1, marginLeft: 12 },
  iconCircle: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: '#F3E8FF',
    alignItems: 'center', justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '600', color: '#111', textAlign: 'right' },
  rowDesc: { fontSize: 13, color: '#9CA3AF', textAlign: 'right', marginTop: 2, lineHeight: 18 },
  footer: { marginTop: 24, fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
});
