import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
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
import { supabase } from '@/lib/supabase';

type Step = 'phone' | 'code' | 'profile';

export default function PhoneLoginModal() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('phone');
  const [loading, setLoading] = useState(false);

  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [topSuccessMessage, setTopSuccessMessage] = useState('');

  const [verificationCode, setVerificationCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const handlePhoneChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
    if (phoneError) setPhoneError('');
    if (topSuccessMessage) setTopSuccessMessage('');
  };

  const handleCodeChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(digitsOnly);
    if (codeError) setCodeError('');
  };

  const isValidIsraeliMobile = (value: string) => /^05\d{8}$/.test(value);

  // Format phone to E.164 for Supabase: 0501234567 → +972501234567
  const toE164 = (local: string) => '+972' + local.slice(1);

  const handleSendCode = async () => {
    const cleanedPhone = phone.trim();

    if (!cleanedPhone) {
      setPhoneError('יש להזין מספר טלפון');
      setTopSuccessMessage('');
      return;
    }
    if (cleanedPhone.length !== 10) {
      setPhoneError('מספר טלפון חייב להכיל 10 ספרות');
      setTopSuccessMessage('');
      return;
    }
    if (!cleanedPhone.startsWith('05')) {
      setPhoneError('מספר טלפון נייד בישראל צריך להתחיל ב־05');
      setTopSuccessMessage('');
      return;
    }
    if (!isValidIsraeliMobile(cleanedPhone)) {
      setPhoneError('מספר הטלפון שהוזן אינו תקין');
      setTopSuccessMessage('');
      return;
    }

    setLoading(true);
    setPhoneError('');

    const { error } = await supabase.auth.signInWithOtp({
      phone: toE164(cleanedPhone),
    });

    setLoading(false);

    if (error) {
      setPhoneError(error.message);
      return;
    }

    setVerificationCode('');
    setCodeError('');
    setTopSuccessMessage('קוד אימות נשלח למספר הטלפון שלך');
    setStep('code');
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setCodeError('יש להזין קוד אימות בן 6 ספרות');
      return;
    }

    setLoading(true);
    setCodeError('');

    const { error } = await supabase.auth.verifyOtp({
      phone: toE164(phone.trim()),
      token: verificationCode,
      type: 'sms',
    });

    setLoading(false);

    if (error) {
      setCodeError('קוד האימות שהוזן שגוי');
      return;
    }

    setCodeError('');
    setTopSuccessMessage('');
    setStep('profile');
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setVerificationCode('');
    setCodeError('');
    setTopSuccessMessage('');
  };

  const isOptionalEmailValid = useMemo(() => {
    if (!email.trim()) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const handleSubmitProfile = async () => {
    const trimmedName = fullName.trim();
    const trimmedBio = bio.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setProfileError('יש להזין שם פרטי');
      setProfileSuccess('');
      return;
    }
    if (!trimmedBio) {
      setProfileError('יש להזין כמה מילים על עצמך');
      setProfileSuccess('');
      return;
    }
    if (trimmedBio.length > 200) {
      setProfileError('תיאור עצמי יכול להכיל עד 200 תווים');
      setProfileSuccess('');
      return;
    }
    if (trimmedEmail && !isOptionalEmailValid) {
      setProfileError('כתובת האימייל אינה תקינה');
      setProfileSuccess('');
      return;
    }

    setLoading(true);
    setProfileError('');

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setProfileError('שגיאה בזיהוי המשתמש. נסה שוב');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: trimmedName,
      phone: phone.trim(),
      bio: trimmedBio,
      email: trimmedEmail || null,
    });

    setLoading(false);

    if (error) {
      setProfileError(`שגיאה בשמירת הפרופיל: ${error.message}`);
      return;
    }

    setProfileSuccess('הפרופיל נשמר בהצלחה');
    setTimeout(() => router.replace('/(tabs)'), 1000);
  };

  const renderTopToast = () => {
    if (!topSuccessMessage) return null;
    return (
      <View style={styles.topToast}>
        <Ionicons name="checkmark-circle" size={22} color="#111111" />
        <Text style={styles.topToastText}>{topSuccessMessage}</Text>
      </View>
    );
  };

  const renderPhoneStep = () => (
    <>
      <Text style={styles.title}>התחבר עם מספר טלפון</Text>
      <Text style={styles.subtitle}>כדי לפרסם סאבלט - צריך הזדהות קצרה</Text>

      <View style={styles.fieldBlock}>
        <Text style={styles.label}>מספר טלפון</Text>
        <View style={[styles.inputWrapper, phoneError ? styles.inputWrapperError : null]}>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={handlePhoneChange}
            placeholder="0501234567"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            textAlign="left"
            maxLength={10}
          />
          <Ionicons name="call-outline" size={24} color="#9CA3AF" />
        </View>
        {phoneError ? (
          <View style={styles.inlineErrorBox}>
            <Ionicons name="alert-circle" size={18} color="#D97706" />
            <Text style={styles.inlineErrorText}>{phoneError}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.infoCardBlue}>
        <View style={styles.infoTitleRow}>
          <Ionicons name="shield-checkmark-outline" size={22} color="#2563EB" />
          <Text style={styles.infoTitleBlue}>אימות ללא סיסמה</Text>
        </View>
        <Text style={styles.infoTextBlue}>
          נשלח לך קוד אימות חד-פעמי בהודעת SMS למספר הטלפון שהזנת
        </Text>
      </View>

      <Pressable
        style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
        onPress={handleSendCode}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.primaryButtonText}>שלח קוד אימות</Text>
        )}
      </Pressable>
    </>
  );

  const renderCodeStep = () => (
    <>
      <Text style={styles.title}>הזן קוד אימות</Text>
      <Text style={styles.subtitle}>כדי לפרסם סאבלט - צריך הזדהות קצרה</Text>

      <View style={styles.codeHero}>
        <View style={styles.codeHeroIconCircle}>
          <Ionicons name="shield-checkmark-outline" size={40} color="#2563EB" />
        </View>
        <Text style={styles.codeHeroText}>שלחנו קוד אימות בן 6 ספרות למספר</Text>
        <Text style={styles.codePhone}>{phone}</Text>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.label}>קוד אימות (6 ספרות)</Text>
        <View style={[styles.inputWrapper, codeError ? styles.inputWrapperError : null]}>
          <TextInput
            style={[styles.input, styles.codeInput]}
            value={verificationCode}
            onChangeText={handleCodeChange}
            placeholder="123456"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            textAlign="center"
            maxLength={6}
          />
        </View>
        {codeError ? (
          <View style={styles.inlineErrorBox}>
            <Ionicons name="alert-circle" size={18} color="#D97706" />
            <Text style={styles.inlineErrorText}>{codeError}</Text>
          </View>
        ) : null}
      </View>

      <Pressable
        style={[styles.primaryButton, (verificationCode.length !== 6 || loading) && styles.primaryButtonDisabled]}
        onPress={handleVerifyCode}
        disabled={verificationCode.length !== 6 || loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.primaryButtonText}>אמת קוד</Text>
        )}
      </Pressable>

      <View style={styles.codeLinksWrap}>
        <Pressable onPress={handleSendCode} disabled={loading}>
          <Text style={styles.linkPrimary}>לא קיבלת קוד? שלח שוב</Text>
        </Pressable>
        <Pressable onPress={handleBackToPhone}>
          <Text style={styles.linkSecondary}>שנה מספר טלפון</Text>
        </Pressable>
      </View>
    </>
  );

  const renderProfileStep = () => (
    <>
      <Text style={styles.title}>השלם את הפרופיל שלך</Text>
      <Text style={styles.subtitle}>כדי לפרסם סאבלט - צריך הזדהות קצרה</Text>

      <View style={styles.profileTopRow}>
        <View style={styles.profileAvatarColumn}>
          <Text style={styles.label}>תמונת פרופיל</Text>
          <View style={styles.avatarCircle}>
            <Ionicons name="person-outline" size={58} color="#9CA3AF" />
          </View>
        </View>
        <View style={styles.uploadColumn}>
          <Pressable style={styles.uploadButton}>
            <Ionicons name="camera-outline" size={22} color="#111111" />
            <Text style={styles.uploadButtonText}>העלה תמונה</Text>
          </Pressable>
          <Text style={styles.helperText}>תמונה אמיתית עוזרת לבנות אמון</Text>
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.label}>שם פרטי *</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (profileError) setProfileError('');
              if (profileSuccess) setProfileSuccess('');
            }}
            placeholder="יוסי"
            placeholderTextColor="#9CA3AF"
            textAlign="right"
          />
          <Ionicons name="person-outline" size={22} color="#9CA3AF" />
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.label}>ספר קצת על עצמך *</Text>
        <TextInput
          style={styles.textArea}
          value={bio}
          onChangeText={(text) => {
            setBio(text.slice(0, 200));
            if (profileError) setProfileError('');
            if (profileSuccess) setProfileSuccess('');
          }}
          placeholder="למשל: סטודנט/ית, עובד/ת היי-טק, אוהב/ת שקט..."
          placeholderTextColor="#9CA3AF"
          multiline
          textAlign="right"
          textAlignVertical="top"
        />
        <Text style={styles.counterText}>{bio.length}/200 תווים</Text>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.label}>אימייל (אופציונלי)</Text>
        <View style={[styles.inputWrapper, email.trim() && !isOptionalEmailValid ? styles.inputWrapperError : null]}>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (profileError) setProfileError('');
              if (profileSuccess) setProfileSuccess('');
            }}
            placeholder="example@email.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            textAlign="left"
          />
          <Ionicons name="mail-outline" size={22} color="#9CA3AF" />
        </View>
        <Text style={styles.helperText}>לא נדרש ליצירת קשר או פרסום</Text>
      </View>

      <View style={styles.whyBox}>
        <View style={styles.whyTitleRow}>
          <Ionicons name="information-circle-outline" size={22} color="#B45309" />
          <Text style={styles.whyTitle}>למה אנחנו שואלים?</Text>
        </View>
        <Text style={styles.whyText}>
          פרופיל אמיתי ואנושי עוזר לבנות אמון בין הדיירים למשכירים. אנחנו לא מסננים אנשים - רק עוזרים ליצור קהילה בטוחה יותר.
        </Text>
      </View>

      {profileError ? (
        <View style={styles.inlineErrorBox}>
          <Ionicons name="alert-circle" size={18} color="#D97706" />
          <Text style={styles.inlineErrorText}>{profileError}</Text>
        </View>
      ) : null}

      {profileSuccess ? (
        <View style={styles.inlineSuccessBox}>
          <Ionicons name="checkmark-circle" size={18} color="#166534" />
          <Text style={styles.inlineSuccessText}>{profileSuccess}</Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
        onPress={handleSubmitProfile}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.primaryButtonText}>השלם הרשמה</Text>
        )}
      </Pressable>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          {renderTopToast()}

          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#4B5563" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === 'phone' && renderPhoneStep()}
            {step === 'code' && renderCodeStep()}
            {step === 'profile' && renderProfileStep()}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  topToast: {
    marginTop: 4,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  topToastText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'right',
    flexShrink: 1,
  },
  headerRow: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'right',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'right',
    marginBottom: 28,
  },
  fieldBlock: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'right',
    marginBottom: 10,
  },
  inputWrapper: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputWrapperError: {
    borderColor: '#F59E0B',
    borderWidth: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111111',
    paddingRight: 12,
  },
  codeInput: {
    letterSpacing: 6,
    paddingRight: 0,
  },
  inlineErrorBox: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  inlineErrorText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  inlineSuccessBox: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  inlineSuccessText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  infoCardBlue: {
    backgroundColor: '#DBEAFE',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 24,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  infoTitleBlue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
    textAlign: 'right',
  },
  infoTextBlue: {
    fontSize: 15,
    color: '#2563EB',
    textAlign: 'right',
    lineHeight: 22,
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#7B2FBE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  codeHero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  codeHeroIconCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  codeHeroText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 6,
  },
  codePhone: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
  },
  codeLinksWrap: {
    marginTop: 24,
    alignItems: 'center',
    gap: 18,
  },
  linkPrimary: {
    fontSize: 16,
    color: '#7B2FBE',
    fontWeight: '700',
  },
  linkSecondary: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '600',
  },
  profileTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 26,
    gap: 20,
  },
  profileAvatarColumn: {
    alignItems: 'center',
    width: 140,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#ECEFF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  uploadColumn: {
    flex: 1,
    alignItems: 'stretch',
  },
  uploadButton: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 34,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
  },
  helperText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
  },
  textArea: {
    minHeight: 130,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111111',
  },
  counterText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'right',
  },
  whyBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 24,
  },
  whyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  whyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400E',
    textAlign: 'right',
  },
  whyText: {
    fontSize: 15,
    color: '#92400E',
    lineHeight: 22,
    textAlign: 'right',
  },
});
