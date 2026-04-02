import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import React, { useMemo, useState } from 'react';
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
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

// ── Option types ──────────────────────────────────────────────
type SelectOption = { label: string; value: string };

type OpenSelect =
  | null
  | 'city'
  | 'rooms'
  | 'bathrooms'
  | 'roommates'
  | 'roommateGender';

// ── Constants ─────────────────────────────────────────────────
const CITY_OPTIONS: SelectOption[] = [
  { label: 'תל אביב', value: 'תל אביב' },
  { label: 'ירושלים', value: 'ירושלים' },
  { label: 'חיפה', value: 'חיפה' },
  { label: 'באר שבע', value: 'באר שבע' },
  { label: 'רעננה', value: 'רעננה' },
  { label: 'הרצליה', value: 'הרצליה' },
];

const ROOM_OPTIONS: SelectOption[] = [
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4+', value: '4' },
];

const BATHROOM_OPTIONS: SelectOption[] = [
  { label: '1', value: '1' },
  { label: '1.5', value: '1.5' },
  { label: '2', value: '2' },
  { label: '2.5', value: '2.5' },
  { label: '3', value: '3' },
];

const ROOMMATE_OPTIONS: SelectOption[] = [
  { label: 'ללא שותפים', value: '0' },
  { label: 'שותף אחד', value: '1' },
  { label: 'שני שותפים', value: '2' },
  { label: 'שלושה שותפים', value: '3' },
  { label: 'ארבעה שותפים ומעלה', value: '4' },
];

const ROOMMATE_GENDER_OPTIONS: SelectOption[] = [
  { label: 'לא משנה', value: 'לא משנה' },
  { label: 'רק נשים', value: 'רק נשים' },
  { label: 'רק גברים', value: 'רק גברים' },
  { label: 'מעורב', value: 'מעורב' },
];

type AmenityKey =
  | 'airConditioning'
  | 'washingMachine'
  | 'kitchen'
  | 'parking'
  | 'furniture'
  | 'internet'
  | 'elevator'
  | 'balcony'
  | 'publicTransport';

const AMENITY_LABELS: Record<AmenityKey, string> = {
  airConditioning: 'מזגן',
  washingMachine: 'מכונת כביסה',
  kitchen: 'מטבח מאובזר',
  parking: 'חניה',
  furniture: 'ריהוט',
  internet: 'אינטרנט',
  elevator: 'מעלית',
  balcony: 'מרפסת',
  publicTransport: 'קרוב לתחבורה ציבורית',
};

const AMENITY_DB_VALUES: Record<AmenityKey, string> = {
  airConditioning: 'מזגן',
  washingMachine: 'מכונת כביסה',
  kitchen: 'מטבח מאובזר',
  parking: 'חניה',
  furniture: 'ריהוט',
  internet: 'אינטרנט',
  elevator: 'מעלית',
  balcony: 'מרפסת',
  publicTransport: 'קרוב לתחבורה ציבורית',
};

type VibeKey =
  | 'youngAndLively'
  | 'quiet'
  | 'studyFriendly'
  | 'sabbathKeepers'
  | 'traditional';

const VIBE_LABELS: Record<VibeKey, string> = {
  youngAndLively: 'צעירה ותוססת',
  quiet: 'שקטה',
  studyFriendly: 'מתאימה ללמידה / עבודה',
  sabbathKeepers: 'שומרי שבת',
  traditional: 'מסורתית',
};

const VIBE_DB_VALUES: Record<VibeKey, string> = {
  youngAndLively: 'צעירה ותוססת',
  quiet: 'שקטה',
  studyFriendly: 'מתאימה ללמידה/עבודה',
  sabbathKeepers: 'שומרי שבת',
  traditional: 'מסורתית',
};

const MAX_IMAGES = 10;

// ── Helpers ───────────────────────────────────────────────────
function formatDate(date: Date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}/${date.getFullYear()}`;
}

function formatInputWithSlashes(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseDateString(value: string) {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match.map(Number);
  const date = new Date(yyyy, mm - 1, dd);
  if (date.getFullYear() !== yyyy || date.getMonth() !== mm - 1 || date.getDate() !== dd) return null;
  return date;
}

function formatPrice(n: number) {
  return `₪${n.toLocaleString('he-IL')}`;
}

// ══════════════════════════════════════════════════════════════
export default function PostSubletScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return <LoadingScreen message="טוען..." />;
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.authGate}>
          <View style={styles.authIconCircle}>
            <Ionicons name="lock-closed-outline" size={48} color="#7B2FBE" />
          </View>
          <Text style={styles.authTitle}>יש להתחבר כדי לפרסם</Text>
          <Text style={styles.authSubtitle}>
            כדי לפרסם סאבלט, עליך להתחבר או ליצור חשבון
          </Text>
          <Pressable
            style={styles.authButton}
            onPress={() => router.push('/modal')}
          >
            <Ionicons name="log-in-outline" size={22} color="#FFFFFF" />
            <Text style={styles.authButtonText}>התחבר / הירשם</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return <PostSubletForm userId={user.id} />;
}

// ── Inner form component (all hooks live here, always called) ──
function PostSubletForm({ userId }: { userId: string }) {
  const router = useRouter();

  // ── Form state ────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [priceText, setPriceText] = useState('');
  const [rooms, setRooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [areaSqm, setAreaSqm] = useState('');
  const [roommates, setRoommates] = useState('0');
  const [roommateGender, setRoommateGender] = useState('לא משנה');
  const [description, setDescription] = useState('');

  // Dates
  const [startDateText, setStartDateText] = useState('');
  const [endDateText, setEndDateText] = useState('');
  const [startDateValue, setStartDateValue] = useState<Date | null>(null);
  const [endDateValue, setEndDateValue] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Amenities
  const [selectedAmenities, setSelectedAmenities] = useState<Record<AmenityKey, boolean>>({
    airConditioning: false,
    washingMachine: false,
    kitchen: false,
    parking: false,
    furniture: false,
    internet: false,
    elevator: false,
    balcony: false,
    publicTransport: false,
  });

  // Vibe
  const [selectedVibes, setSelectedVibes] = useState<Record<VibeKey, boolean>>({
    youngAndLively: false,
    quiet: false,
    studyFriendly: false,
    sabbathKeepers: false,
    traditional: false,
  });

  // Images
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

  // UI state
  const [openSelect, setOpenSelect] = useState<OpenSelect>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ── Computed labels ───────────────────────────────────────
  const cityLabel = useMemo(
    () => CITY_OPTIONS.find((o) => o.value === city)?.label ?? 'בחר עיר',
    [city]
  );
  const roomsLabel = useMemo(
    () => ROOM_OPTIONS.find((o) => o.value === rooms)?.label ?? 'בחר',
    [rooms]
  );
  const bathroomsLabel = useMemo(
    () => BATHROOM_OPTIONS.find((o) => o.value === bathrooms)?.label ?? 'בחר',
    [bathrooms]
  );
  const roommatesLabel = useMemo(
    () => ROOMMATE_OPTIONS.find((o) => o.value === roommates)?.label ?? 'ללא שותפים',
    [roommates]
  );
  const roommateGenderLabel = useMemo(
    () => ROOMMATE_GENDER_OPTIONS.find((o) => o.value === roommateGender)?.label ?? 'לא משנה',
    [roommateGender]
  );

  // ── Date handlers ─────────────────────────────────────────
  const handleStartDateTextChange = (text: string) => {
    const formatted = formatInputWithSlashes(text);
    setStartDateText(formatted);
    const parsed = parseDateString(formatted);
    if (parsed) setStartDateValue(parsed);
  };

  const handleEndDateTextChange = (text: string) => {
    const formatted = formatInputWithSlashes(text);
    setEndDateText(formatted);
    const parsed = parseDateString(formatted);
    if (parsed) setEndDateValue(parsed);
  };

  const handleStartPickerChange = (_event: any, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (_event?.type !== 'set' || !selectedDate) return;
    setStartDateValue(selectedDate);
    setStartDateText(formatDate(selectedDate));
    if (endDateValue && selectedDate > endDateValue) {
      setEndDateValue(selectedDate);
      setEndDateText(formatDate(selectedDate));
    }
  };

  const handleEndPickerChange = (_event: any, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (_event?.type !== 'set' || !selectedDate) return;
    setEndDateValue(selectedDate);
    setEndDateText(formatDate(selectedDate));
  };

  // ── Image picker ──────────────────────────────────────────
  const pickImages = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('מקסימום תמונות', `ניתן להעלות עד ${MAX_IMAGES} תמונות`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImages((prev) => [...prev, ...result.assets].slice(0, MAX_IMAGES));
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Upload images to Supabase Storage ─────────────────────
  async function uploadImages(subletId: string): Promise<string[]> {
    const urls: string[] = [];
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    for (let i = 0; i < images.length; i++) {
      const asset = images[i];
      const ext = asset.uri.split('.').pop() ?? 'jpg';
      const filePath = `${subletId}/${i}.${ext}`;
      const contentType = asset.mimeType ?? `image/${ext}`;

      // Build FormData — React Native's fetch handles file URIs natively
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: `${i}.${ext}`,
        type: contentType,
      } as any);

      try {
        const res = await fetch(
          `${supabaseUrl}/storage/v1/object/sublet-images/${filePath}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'x-upsert': 'true',
            },
            body: formData,
          }
        );

        if (!res.ok) {
          const body = await res.text();
          console.warn(`Image upload failed for ${filePath}:`, body);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('sublet-images')
          .getPublicUrl(filePath);

        urls.push(urlData.publicUrl);
      } catch (err: any) {
        console.warn(`Image upload error for ${filePath}:`, err.message);
      }
    }

    return urls;
  }

  // ── Validation ────────────────────────────────────────────
  function validate(): string | null {
    if (!title.trim()) return 'יש להזין כותרת למודעה';
    if (!city) return 'יש לבחור עיר';
    if (!priceText.trim() || Number(priceText) <= 0) return 'יש להזין מחיר חודשי תקין';
    if (!rooms) return 'יש לבחור מספר חדרים';
    if (!startDateValue) return 'יש להזין תאריך התחלה';
    if (!endDateValue) return 'יש להזין תאריך סיום';
    if (endDateValue <= startDateValue) return 'תאריך הסיום חייב להיות אחרי תאריך ההתחלה';
    return null;
  }

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const amenitiesArr = (Object.keys(selectedAmenities) as AmenityKey[])
        .filter((k) => selectedAmenities[k])
        .map((k) => AMENITY_DB_VALUES[k]);

      const vibeArr = (Object.keys(selectedVibes) as VibeKey[])
        .filter((k) => selectedVibes[k])
        .map((k) => VIBE_DB_VALUES[k]);

      const insertData = {
        user_id: userId,
        title: title.trim(),
        city,
        neighborhood: neighborhood.trim() || null,
        address: address.trim() || null,
        price_per_month: Number(priceText),
        num_rooms: Number(rooms),
        num_bathrooms: bathrooms ? Number(bathrooms) : null,
        area_sqm: areaSqm ? Number(areaSqm) : null,
        available_from: startDateValue!.toISOString().split('T')[0],
        available_until: endDateValue!.toISOString().split('T')[0],
        num_roommates: Number(roommates),
        roommate_gender: roommateGender,
        amenities: amenitiesArr.length > 0 ? amenitiesArr : null,
        apartment_vibe: vibeArr.length > 0 ? vibeArr : null,
        description: description.trim() || null,
        is_active: true,
      };

      const { data: inserted, error: insertError } = await supabase
        .from('sublets')
        .insert(insertData)
        .select('id')
        .single();

      if (insertError) {
        setErrorMsg(`שגיאה בשמירה: ${insertError.message}`);
        setSubmitting(false);
        return;
      }

      // Upload images if any
      if (images.length > 0 && inserted?.id) {
        const imageUrls = await uploadImages(inserted.id);
        if (imageUrls.length > 0) {
          await supabase
            .from('sublets')
            .update({ images: imageUrls })
            .eq('id', inserted.id);
        }
      }

      setSuccessMsg('המודעה פורסמה בהצלחה!');
      // Navigate back to home after short delay
      setTimeout(() => router.replace('/'), 1500);
    } catch (err: any) {
      setErrorMsg(`שגיאה: ${err.message ?? 'אירעה שגיאה לא צפויה'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Dropdown renderer (matches index.tsx pattern) ─────────
  const renderSelect = (
    label: string,
    valueLabel: string,
    selectKey: Exclude<OpenSelect, null>,
    options: SelectOption[],
    onSelect: (value: string) => void,
    placeholder?: string
  ) => {
    const isOpen = openSelect === selectKey;
    const isPlaceholder = !options.some((o) => o.label === valueLabel);

    return (
      <View style={styles.selectBlock}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Pressable
          style={[styles.selectField, isOpen && styles.selectFieldOpen]}
          onPress={() => setOpenSelect(isOpen ? null : selectKey)}
        >
          <Text style={[styles.selectValue, isPlaceholder && styles.selectPlaceholder]}>
            {valueLabel}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#A1A1AA" />
        </Pressable>

        {isOpen && (
          <View style={styles.dropdownMenu}>
            {options.map((option, index) => {
              const isSelected = option.label === valueLabel;
              return (
                <Pressable
                  key={option.value}
                  style={[
                    styles.dropdownItem,
                    index === 0 && styles.dropdownItemFirst,
                    index === options.length - 1 && styles.dropdownItemLast,
                    isSelected && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    onSelect(option.value);
                    setOpenSelect(null);
                  }}
                >
                  <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
                    {option.label}
                  </Text>
                  {isSelected ? (
                    <Ionicons name="checkmark" size={20} color="#6B7280" />
                  ) : (
                    <View style={styles.checkPlaceholder} />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  // ══════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => setOpenSelect(null)}
        >
          {/* ── Header ──────────────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>פרסם סאבלט</Text>
                <Text style={styles.headerSubtitle}>מלא את הפרטים ופרסם את הדירה</Text>
              </View>
            </View>
          </View>

          <View style={styles.body}>
            {/* ── Title ─────────────────────────────────── */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>כותרת המודעה *</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="למשל: דירת 3 חדרים מהממת בפלורנטין"
                placeholderTextColor="#9CA3AF"
                textAlign="right"
              />
            </View>

            {/* ── City ──────────────────────────────────── */}
            {renderSelect('עיר *', cityLabel, 'city', CITY_OPTIONS, setCity)}

            {/* ── Neighborhood ──────────────────────────── */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>שכונה</Text>
              <TextInput
                style={styles.textInput}
                value={neighborhood}
                onChangeText={setNeighborhood}
                placeholder="למשל: פלורנטין, נווה צדק"
                placeholderTextColor="#9CA3AF"
                textAlign="right"
              />
            </View>

            {/* ── Address ───────────────────────────────── */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>כתובת מלאה</Text>
              <TextInput
                style={styles.textInput}
                value={address}
                onChangeText={setAddress}
                placeholder="למשל: רחוב הרצל 15"
                placeholderTextColor="#9CA3AF"
                textAlign="right"
              />
            </View>

            {/* ── Price ─────────────────────────────────── */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>מחיר לחודש (₪) *</Text>
              <TextInput
                style={styles.textInput}
                value={priceText}
                onChangeText={(t) => setPriceText(t.replace(/\D/g, ''))}
                placeholder="3500"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                textAlign="right"
              />
              {priceText ? (
                <Text style={styles.pricePreview}>{formatPrice(Number(priceText))} לחודש</Text>
              ) : null}
            </View>

            {/* ── Rooms & Bathrooms row ─────────────────── */}
            <View style={styles.rowTwoCol}>
              <View style={styles.colHalf}>
                {renderSelect('חדרים *', roomsLabel, 'rooms', ROOM_OPTIONS, setRooms)}
              </View>
              <View style={styles.colHalf}>
                {renderSelect('מקלחות', bathroomsLabel, 'bathrooms', BATHROOM_OPTIONS, setBathrooms)}
              </View>
            </View>

            {/* ── Area ──────────────────────────────────── */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>שטח במ"ר</Text>
              <TextInput
                style={styles.textInput}
                value={areaSqm}
                onChangeText={(t) => setAreaSqm(t.replace(/\D/g, ''))}
                placeholder="65"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                textAlign="right"
              />
            </View>

            {/* ── Dates ─────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="calendar-outline" size={22} color="#2563EB" />
                <Text style={styles.cardTitle}>תאריכי זמינות *</Text>
              </View>

              <View style={styles.dateRow}>
                <View style={styles.dateCol}>
                  <Text style={styles.fieldLabel}>מתאריך</Text>
                  <Pressable
                    style={styles.dateField}
                    onPress={() => setShowStartPicker(true)}
                  >
                    <TextInput
                      style={styles.dateTextInput}
                      value={startDateText}
                      onChangeText={handleStartDateTextChange}
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      textAlign="right"
                    />
                    <Ionicons name="calendar-outline" size={20} color="#93C5FD" />
                  </Pressable>
                  {showStartPicker && (
                    <DateTimePicker
                      value={startDateValue ?? new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleStartPickerChange}
                      minimumDate={new Date()}
                    />
                  )}
                </View>

                <View style={styles.dateCol}>
                  <Text style={styles.fieldLabel}>עד תאריך</Text>
                  <Pressable
                    style={styles.dateField}
                    onPress={() => setShowEndPicker(true)}
                  >
                    <TextInput
                      style={styles.dateTextInput}
                      value={endDateText}
                      onChangeText={handleEndDateTextChange}
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      textAlign="right"
                    />
                    <Ionicons name="calendar-outline" size={20} color="#93C5FD" />
                  </Pressable>
                  {showEndPicker && (
                    <DateTimePicker
                      value={endDateValue ?? startDateValue ?? new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleEndPickerChange}
                      minimumDate={startDateValue ?? new Date()}
                    />
                  )}
                </View>
              </View>
            </View>

            {/* ── Roommates ─────────────────────────────── */}
            <View style={styles.rowTwoCol}>
              <View style={styles.colHalf}>
                {renderSelect('שותפים', roommatesLabel, 'roommates', ROOMMATE_OPTIONS, setRoommates)}
              </View>
              <View style={styles.colHalf}>
                {renderSelect('הרכב שותפים', roommateGenderLabel, 'roommateGender', ROOMMATE_GENDER_OPTIONS, setRoommateGender)}
              </View>
            </View>

            {/* ── Amenities ─────────────────────────────── */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>מתקנים ושירותים</Text>
              <View style={styles.chipsGrid}>
                {(Object.keys(AMENITY_LABELS) as AmenityKey[]).map((key) => {
                  const checked = selectedAmenities[key];
                  return (
                    <Pressable
                      key={key}
                      style={[styles.chip, checked && styles.chipSelected]}
                      onPress={() =>
                        setSelectedAmenities((prev) => ({ ...prev, [key]: !prev[key] }))
                      }
                    >
                      {checked && <Ionicons name="checkmark" size={16} color="#2563EB" />}
                      <Text style={[styles.chipText, checked && styles.chipTextSelected]}>
                        {AMENITY_LABELS[key]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* ── Apartment Vibe ─────────────────────────── */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>אופי הדירה</Text>
              <View style={styles.vibeList}>
                {(Object.keys(VIBE_LABELS) as VibeKey[]).map((key) => {
                  const checked = selectedVibes[key];
                  return (
                    <Pressable
                      key={key}
                      style={styles.checkboxRow}
                      onPress={() =>
                        setSelectedVibes((prev) => ({ ...prev, [key]: !prev[key] }))
                      }
                    >
                      <Text style={styles.checkboxLabel}>{VIBE_LABELS[key]}</Text>
                      <View style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]}>
                        {checked && <Ionicons name="checkmark" size={16} color="#2563EB" />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* ── Description ───────────────────────────── */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>תיאור</Text>
              <TextInput
                style={styles.textArea}
                value={description}
                onChangeText={setDescription}
                placeholder="ספר/י על הדירה, האווירה, השכנים, מה כלול..."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlign="right"
                textAlignVertical="top"
              />
            </View>

            {/* ── Images ────────────────────────────────── */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>תמונות (עד {MAX_IMAGES})</Text>

              <View style={styles.imagesGrid}>
                {images.map((img, i) => (
                  <View key={i} style={styles.imageThumb}>
                    <Image source={{ uri: img.uri }} style={styles.imageThumbImg} />
                    <Pressable
                      style={styles.imageRemoveBtn}
                      onPress={() => removeImage(i)}
                    >
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </Pressable>
                  </View>
                ))}

                {images.length < MAX_IMAGES && (
                  <Pressable style={styles.imageAddBtn} onPress={pickImages}>
                    <Ionicons name="camera-outline" size={28} color="#9CA3AF" />
                    <Text style={styles.imageAddText}>הוסף תמונות</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* ── Error / Success messages ──────────────── */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#D97706" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {successMsg ? (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={18} color="#166534" />
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            ) : null}

            {/* ── Submit Button ──────────────────────────── */}
            <Pressable
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={22} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>פרסם מודעה</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#7B2FBE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'right',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'right',
  },

  // Body
  body: {
    paddingHorizontal: 24,
  },

  // Fields
  fieldBlock: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
    textAlign: 'right',
    marginBottom: 8,
  },
  textInput: {
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111111',
    textAlign: 'right',
  },
  pricePreview: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '700',
    color: '#22C55E',
    textAlign: 'right',
  },
  textArea: {
    minHeight: 120,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111111',
    textAlign: 'right',
  },

  // Two-column row
  rowTwoCol: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  colHalf: {
    flex: 1,
  },

  // Dates card
  card: {
    backgroundColor: '#FAFAFA',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#93C5FD',
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 18,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'right',
    width: '100%',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateCol: {
    flex: 1,
  },
  dateField: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#93C5FD',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#111111',
    textAlign: 'right',
  },

  // Dropdowns (matching index.tsx)
  selectBlock: {
    marginBottom: 16,
  },
  selectField: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: '#EFEFF1',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectFieldOpen: {
    borderWidth: 1,
    borderColor: '#D4D4D8',
    backgroundColor: '#FFFFFF',
  },
  selectValue: {
    fontSize: 16,
    color: '#111111',
    textAlign: 'right',
  },
  selectPlaceholder: {
    color: '#9CA3AF',
  },
  dropdownMenu: {
    marginTop: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  dropdownItem: {
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  dropdownItemFirst: {
    paddingTop: 6,
  },
  dropdownItemLast: {
    paddingBottom: 6,
  },
  dropdownItemSelected: {
    backgroundColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#3F3F46',
    textAlign: 'right',
  },
  dropdownItemTextSelected: {
    color: '#111111',
  },
  checkPlaceholder: {
    width: 20,
    height: 20,
  },

  // Sections
  sectionBlock: {
    marginBottom: 22,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'right',
    marginBottom: 14,
  },

  // Amenity chips
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  chipSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  chipText: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'right',
  },
  chipTextSelected: {
    color: '#2563EB',
    fontWeight: '600',
  },

  // Vibe checkboxes
  vibeList: {
    gap: 12,
  },
  checkboxRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#111111',
    textAlign: 'right',
  },
  checkboxBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#D4D4D8',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },

  // Images
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageThumb: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  imageThumbImg: {
    width: '100%',
    height: '100%',
  },
  imageRemoveBtn: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  imageAddBtn: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  imageAddText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Messages
  errorBox: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  errorText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
  },
  successBox: {
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
  successText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
  },

  // Submit
  submitButton: {
    height: 58,
    borderRadius: 16,
    backgroundColor: '#7B2FBE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'right',
  },

  // Auth gate
  authGate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  authIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  authButton: {
    marginTop: 8,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#7B2FBE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
  },
});
