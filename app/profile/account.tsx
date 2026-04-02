import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailLoading, setEmailLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [emailMsg, setEmailMsg] = useState({ type: '', text: '' });
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });

  const handleChangeEmail = async () => {
    if (!newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      setEmailMsg({ type: 'error', text: 'יש להזין כתובת אימייל תקינה' });
      return;
    }
    setEmailLoading(true);
    setEmailMsg({ type: '', text: '' });

    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setEmailLoading(false);

    if (error) {
      setEmailMsg({ type: 'error', text: error.message });
    } else {
      setEmailMsg({ type: 'success', text: 'נשלח אימייל אימות לכתובת החדשה' });
      setNewEmail('');
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setPassMsg({ type: 'error', text: 'הסיסמה החדשה חייבת להכיל לפחות 6 תווים' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'error', text: 'הסיסמאות אינן תואמות' });
      return;
    }
    setPassLoading(true);
    setPassMsg({ type: '', text: '' });

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPassLoading(false);

    if (error) {
      setPassMsg({ type: 'error', text: error.message });
    } else {
      setPassMsg({ type: 'success', text: 'הסיסמה שונתה בהצלחה' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-forward" size={24} color="#111" />
          </Pressable>
          <Text style={s.headerTitle}>הגדרות חשבון</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView style={s.flex} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {/* Current email */}
          <View style={s.infoCard}>
            <View style={s.infoRow}>
              <Ionicons name="mail-outline" size={20} color="#7B2FBE" />
              <Text style={s.infoLabel}>אימייל נוכחי</Text>
            </View>
            <Text style={s.infoValue}>{user?.email}</Text>
          </View>

          {/* Change email section */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>שינוי אימייל</Text>
            <View style={s.field}>
              <Text style={s.label}>אימייל חדש</Text>
              <TextInput
                style={s.input}
                value={newEmail}
                onChangeText={(t) => { setNewEmail(t); setEmailMsg({ type: '', text: '' }); }}
                placeholder="email@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign="left"
              />
            </View>
            {emailMsg.text ? <MsgBox type={emailMsg.type} text={emailMsg.text} /> : null}
            <Pressable style={[s.btn, emailLoading && { opacity: 0.6 }]} onPress={handleChangeEmail} disabled={emailLoading}>
              {emailLoading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={s.btnText}>עדכן אימייל</Text>}
            </Pressable>
          </View>

          <View style={s.divider} />

          {/* Change password section */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>שינוי סיסמה</Text>
            <View style={s.field}>
              <Text style={s.label}>סיסמה חדשה</Text>
              <TextInput
                style={s.input}
                value={newPassword}
                onChangeText={(t) => { setNewPassword(t); setPassMsg({ type: '', text: '' }); }}
                placeholder="לפחות 6 תווים"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                textAlign="left"
              />
            </View>
            <View style={s.field}>
              <Text style={s.label}>אישור סיסמה חדשה</Text>
              <TextInput
                style={s.input}
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); setPassMsg({ type: '', text: '' }); }}
                placeholder="הזן שוב"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                textAlign="left"
              />
            </View>
            {passMsg.text ? <MsgBox type={passMsg.type} text={passMsg.text} /> : null}
            <Pressable style={[s.btn, passLoading && { opacity: 0.6 }]} onPress={handleChangePassword} disabled={passLoading}>
              {passLoading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={s.btnText}>שנה סיסמה</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MsgBox({ type, text }: { type: string; text: string }) {
  const isErr = type === 'error';
  return (
    <View style={[s.msgBox, isErr ? s.msgErr : s.msgOk]}>
      <Ionicons name={isErr ? 'alert-circle' : 'checkmark-circle'} size={18} color={isErr ? '#D97706' : '#166534'} />
      <Text style={[s.msgText, { color: isErr ? '#92400E' : '#166534' }]}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 22, paddingBottom: 40 },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111' },
  infoCard: {
    marginTop: 20, backgroundColor: '#F3E8FF', borderRadius: 16,
    paddingHorizontal: 18, paddingVertical: 16,
  },
  infoRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 6 },
  infoLabel: { fontSize: 14, fontWeight: '600', color: '#7B2FBE' },
  infoValue: { fontSize: 16, color: '#374151', textAlign: 'right' },
  section: { marginTop: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111', textAlign: 'right', marginBottom: 16 },
  field: { marginBottom: 16 },
  label: { fontSize: 15, fontWeight: '600', color: '#111', textAlign: 'right', marginBottom: 8 },
  input: {
    minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: '#D1D5DB',
    backgroundColor: '#FFF', paddingHorizontal: 16, fontSize: 16, color: '#111',
  },
  btn: {
    height: 52, borderRadius: 14, backgroundColor: '#7B2FBE',
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  btnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginTop: 28 },
  msgBox: {
    marginBottom: 14, flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1,
  },
  msgErr: { backgroundColor: '#FFF7ED', borderColor: '#FCD34D' },
  msgOk: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
  msgText: { fontSize: 14, fontWeight: '600', textAlign: 'right', flexShrink: 1 },
});
