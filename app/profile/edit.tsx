import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('full_name, phone, avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name ?? '');
          setPhone(data.phone ?? '');
          setAvatarUrl(data.avatar_url);
        }
        setLoading(false);
      });
  }, [user]);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUrl(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!fullName.trim()) {
      setErrorMsg('יש להזין שם');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
      })
      .eq('id', user.id);

    // Also update auth metadata
    await supabase.auth.updateUser({
      data: { full_name: fullName.trim() },
    });

    setSaving(false);

    if (error) {
      setErrorMsg(`שגיאה: ${error.message}`);
    } else {
      setSuccessMsg('הפרופיל עודכן בהצלחה');
      setTimeout(() => router.back(), 1000);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <ActivityIndicator size="large" color="#7B2FBE" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-forward" size={24} color="#111" />
          </Pressable>
          <Text style={s.headerTitle}>עריכת פרופיל</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={s.flex}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <View style={s.avatarSection}>
            <Pressable onPress={pickAvatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={s.avatar} />
              ) : (
                <View style={s.avatarPlaceholder}>
                  <Ionicons name="person" size={44} color="#FFFFFF" />
                </View>
              )}
              <View style={s.cameraBadge}>
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </View>
            </Pressable>
            <Text style={s.avatarHint}>לחץ לשינוי תמונה</Text>
          </View>

          {/* Name */}
          <View style={s.field}>
            <Text style={s.label}>שם מלא *</Text>
            <View style={s.inputWrap}>
              <TextInput
                style={s.input}
                value={fullName}
                onChangeText={(t) => { setFullName(t); setErrorMsg(''); setSuccessMsg(''); }}
                placeholder="ישראל ישראלי"
                placeholderTextColor="#9CA3AF"
                textAlign="right"
              />
              <Ionicons name="person-outline" size={20} color="#9CA3AF" />
            </View>
          </View>

          {/* Phone */}
          <View style={s.field}>
            <Text style={s.label}>טלפון</Text>
            <View style={s.inputWrap}>
              <TextInput
                style={s.input}
                value={phone}
                onChangeText={(t) => { setPhone(t.replace(/\D/g, '')); setErrorMsg(''); setSuccessMsg(''); }}
                placeholder="0501234567"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                textAlign="left"
                maxLength={10}
              />
              <Ionicons name="call-outline" size={20} color="#9CA3AF" />
            </View>
          </View>

          {/* Email (read-only) */}
          <View style={s.field}>
            <Text style={s.label}>אימייל</Text>
            <View style={[s.inputWrap, { backgroundColor: '#E5E7EB' }]}>
              <Text style={[s.input, { color: '#6B7280' }]}>{user?.email}</Text>
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
            </View>
            <Text style={s.hint}>ניתן לשנות אימייל בהגדרות חשבון</Text>
          </View>

          {/* Messages */}
          {errorMsg ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#D97706" />
              <Text style={s.errorText}>{errorMsg}</Text>
            </View>
          ) : null}
          {successMsg ? (
            <View style={s.successBox}>
              <Ionicons name="checkmark-circle" size={18} color="#166534" />
              <Text style={s.successText}>{successMsg}</Text>
            </View>
          ) : null}

        </ScrollView>

        {/* Save — fixed at bottom */}
        <View style={s.saveBtnContainer}>
          <Pressable style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={s.saveBtnText}>שמור שינויים</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 22, paddingBottom: 40 },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111' },
  avatarSection: { alignItems: 'center', marginVertical: 28 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#9B59D6',
    alignItems: 'center', justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#7B2FBE', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFF',
  },
  avatarHint: { marginTop: 10, fontSize: 14, color: '#9CA3AF' },
  field: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '700', color: '#111', textAlign: 'right', marginBottom: 8 },
  inputWrap: {
    minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: '#D1D5DB',
    backgroundColor: '#FFF', paddingHorizontal: 16, flexDirection: 'row-reverse',
    alignItems: 'center', justifyContent: 'space-between',
  },
  input: { flex: 1, fontSize: 16, color: '#111', paddingRight: 10 },
  hint: { marginTop: 6, fontSize: 13, color: '#9CA3AF', textAlign: 'right' },
  errorBox: {
    marginBottom: 16, flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FCD34D',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
  },
  errorText: { color: '#92400E', fontSize: 14, fontWeight: '600', textAlign: 'right', flexShrink: 1 },
  successBox: {
    marginBottom: 16, flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
    backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#86EFAC',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
  },
  successText: { color: '#166534', fontSize: 14, fontWeight: '600', textAlign: 'right', flexShrink: 1 },
  saveBtnContainer: {
    paddingHorizontal: 22, paddingTop: 12, paddingBottom: 24,
    backgroundColor: '#F3F4F6', borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  saveBtn: {
    height: 56, borderRadius: 16, backgroundColor: '#7B2FBE',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7B2FBE', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});
