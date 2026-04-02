import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Slider } from '@miblanchard/react-native-slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSublets, type Sublet, type SubletFilters } from '@/lib/hooks/useSublets';


type SelectOption = {
  label: string;
  value: string;
};

type AmenityKey =
  | 'airConditioning'
  | 'elevator'
  | 'storage'
  | 'parking'
  | 'garden'
  | 'accessible'
  | 'safeRoom'
  | 'washingMachine'
  | 'furnished'
  | 'petFriendly';

type ApartmentFeatureKey =
  | 'youngAndLively'
  | 'quiet'
  | 'studyFriendly'
  | 'sabbathKeepers'
  | 'traditional';

const LOCATION_OPTIONS: SelectOption[] = [
  { label: 'הכל', value: 'הכל' },
  { label: 'תל אביב', value: 'תל אביב' },
  { label: 'ירושלים', value: 'ירושלים' },
  { label: 'חיפה', value: 'חיפה' },
  { label: 'באר שבע', value: 'באר שבע' },
  { label: 'רעננה', value: 'רעננה' },
  { label: 'הרצליה', value: 'הרצליה' },
];

const ROOM_OPTIONS: SelectOption[] = [
  { label: 'הכל', value: 'all' },
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4+', value: '4' },
];

const PARTNER_OPTIONS: SelectOption[] = [
  { label: 'הכל', value: 'all' },
  { label: 'ללא שותפים', value: '0' },
  { label: 'שותף אחד', value: '1' },
  { label: 'שני שותפים', value: '2' },
  { label: 'שלושה שותפים', value: '3' },
  { label: 'ארבעה שותפים ומעלה', value: '4' },
];

const ROOMMATE_TYPE_OPTIONS: SelectOption[] = [
  { label: 'הכל', value: 'הכל' },
  { label: 'רק נשים', value: 'רק נשים' },
  { label: 'רק גברים', value: 'רק גברים' },
  { label: 'מעורב', value: 'מעורב' },
  { label: 'לא משנה', value: 'לא משנה' },
];

const AMENITY_LABELS: Record<AmenityKey, string> = {
  airConditioning: 'מזגן',
  elevator: 'מעלית',
  storage: 'מחסן',
  parking: 'חניה',
  garden: 'גינה',
  accessible: 'מונגש / נגישות',
  safeRoom: 'ממ״ד',
  washingMachine: 'מכונת כביסה',
  furnished: 'מרוהט',
  petFriendly: 'חיות מחמד',
};

const APARTMENT_FEATURE_LABELS: Record<ApartmentFeatureKey, string> = {
  youngAndLively: 'צעירה ותוססת',
  quiet: 'שקטה',
  studyFriendly: 'מתאימה ללמידה / עבודה',
  sabbathKeepers: 'שומרי שבת',
  traditional: 'מסורתית',
};

const LEGEND_ITEMS = [
  { label: 'מיידי (0-14 ימים)', color: '#22C55E' },
  { label: 'בקרוב (15-45 ימים)', color: '#EAB308' },
  { label: 'עתידי (+45 ימים)', color: '#3B82F6' },
  { label: 'מסתיים בקרוב', color: '#556888' },
];

// Map amenity keys to Hebrew DB values
const AMENITY_DB_VALUES: Record<AmenityKey, string> = {
  airConditioning: 'מזגן',
  elevator: 'מעלית',
  storage: 'מחסן',
  parking: 'חניה',
  garden: 'גינה',
  accessible: 'מונגש / נגישות',
  safeRoom: 'ממ״ד',
  washingMachine: 'מכונת כביסה',
  furnished: 'ריהוט',
  petFriendly: 'חיות מחמד',
};

// Map apartment feature keys to Hebrew DB values
const FEATURE_DB_VALUES: Record<ApartmentFeatureKey, string> = {
  youngAndLively: 'צעירה ותוססת',
  quiet: 'שקטה',
  studyFriendly: 'מתאימה ללמידה/עבודה',
  sabbathKeepers: 'שומרי שבת',
  traditional: 'מסורתית',
};

const ISRAEL_REGION = {
  latitude: 31.5,
  longitude: 34.8,
  latitudeDelta: 3,
  longitudeDelta: 3,
};

function getMarkerColor(availableFrom: string): string {
  const now = new Date();
  const from = new Date(availableFrom);
  const diffDays = Math.floor((from.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 14) return '#22C55E';  // green - immediate
  if (diffDays <= 45) return '#EAB308';  // yellow - soon
  return '#3B82F6';                       // blue - future
}

type OpenSelect =
  | null
  | 'location'
  | 'rooms'
  | 'partners'
  | 'roommateType';

export default function HomeScreen(){
  const router = useRouter();
  const clearDates = () => {
  setStartDateText('');
  setEndDateText('');
  setStartDateValue(null);
  setEndDateValue(null);
  setShowStartPicker(false);
  setShowEndPicker(false);
};
  const [searchText, setSearchText] = useState('');
  const [isDatesOpen, setIsDatesOpen] = useState(true);
  const [isAdditionalFiltersOpen, setIsAdditionalFiltersOpen] = useState(true);

const [startDateText, setStartDateText] = useState('');
const [endDateText, setEndDateText] = useState('');

const [startDateValue, setStartDateValue] = useState<Date | null>(null);
const [endDateValue, setEndDateValue] = useState<Date | null>(null);

const [showStartPicker, setShowStartPicker] = useState(false);
const [showEndPicker, setShowEndPicker] = useState(false);

  const [location, setLocation] = useState('הכל');
  const [rooms, setRooms] = useState('all');
  const [partners, setPartners] = useState('all');
  const [roommateType, setRoommateType] = useState('הכל');

  const MIN_ALLOWED_PRICE = 1000;
  const MAX_ALLOWED_PRICE = 15000;

  const [priceRange, setPriceRange] = useState<number[]>([1000, 15000]);

  const [selectedAmenities, setSelectedAmenities] = useState<Record<AmenityKey, boolean>>({
    airConditioning: false,
    elevator: false,
    storage: false,
    parking: false,
    garden: false,
    accessible: false,
    safeRoom: false,
    washingMachine: false,
    furnished: false,
    petFriendly: false,
  });

  const [selectedApartmentFeatures, setSelectedApartmentFeatures] = useState<
    Record<ApartmentFeatureKey, boolean>
  >({
    youngAndLively: false,
    quiet: false,
    studyFriendly: false,
    sabbathKeepers: false,
    traditional: false,
  });

  const [openSelect, setOpenSelect] = useState<OpenSelect>(null);

  const locationLabel = useMemo(
    () => LOCATION_OPTIONS.find((option) => option.value === location)?.label ?? 'הכל',
    [location]
  );

  const roomsLabel = useMemo(
    () => ROOM_OPTIONS.find((option) => option.value === rooms)?.label ?? 'הכל',
    [rooms]
  );

  const partnersLabel = useMemo(
    () => PARTNER_OPTIONS.find((option) => option.value === partners)?.label ?? 'הכל',
    [partners]
  );

  const roommateTypeLabel = useMemo(
    () => ROOMMATE_TYPE_OPTIONS.find((option) => option.value === roommateType)?.label ?? 'הכל',
    [roommateType]
  );

  // Build filters for Supabase query
  const supabaseFilters = useMemo<SubletFilters>(() => {
    const selectedAmenityValues = (Object.keys(selectedAmenities) as AmenityKey[])
      .filter((key) => selectedAmenities[key])
      .map((key) => AMENITY_DB_VALUES[key]);

    const selectedVibeValues = (Object.keys(selectedApartmentFeatures) as ApartmentFeatureKey[])
      .filter((key) => selectedApartmentFeatures[key])
      .map((key) => FEATURE_DB_VALUES[key]);

    return {
      city: location,
      dateFrom: startDateValue ? startDateValue.toISOString().split('T')[0] : undefined,
      dateTo: endDateValue ? endDateValue.toISOString().split('T')[0] : undefined,
      rooms: rooms !== 'all' ? Number(rooms) : null,
      roommatesCount: partners !== 'all' ? Number(partners) : null,
      priceMin: priceRange[0],
      priceMax: priceRange[1],
      roommateGender: roommateType,
      amenities: selectedAmenityValues.length > 0 ? selectedAmenityValues : undefined,
      vibe: selectedVibeValues.length > 0 ? selectedVibeValues : undefined,
    };
  }, [location, startDateValue, endDateValue, rooms, partners, priceRange, roommateType, selectedAmenities, selectedApartmentFeatures]);

  const { sublets, loading } = useSublets(supabaseFilters);

  // Only show sublets that have coordinates on the map
  const mappableSublets = useMemo(
    () => sublets.filter((s) => s.lat != null && s.lng != null),
    [sublets]
  );

  const formatCardDate = (iso: string) => {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  };

  const CITY_ORDER = ['תל אביב', 'ירושלים', 'חיפה', 'הרצליה', 'רעננה', 'באר שבע'];
  const subletsByCity = useMemo(() => {
    const grouped: Record<string, Sublet[]> = {};
    for (const s of sublets) {
      const city = s.city || 'אחר';
      if (!grouped[city]) grouped[city] = [];
      grouped[city].push(s);
    }
    return Object.entries(grouped).sort(([a], [b]) => {
      const ai = CITY_ORDER.indexOf(a);
      const bi = CITY_ORDER.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [sublets]);

  const toggleAmenity = (key: AmenityKey) => {
    setSelectedAmenities((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleApartmentFeature = (key: ApartmentFeatureKey) => {
    setSelectedApartmentFeatures((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const closeAllDropdowns = () => 
  {
    setOpenSelect(null);
  };
  
  const formatDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const parseDateString = (value: string) => {
  const cleaned = value.trim();
  const match = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

const formatInputWithSlashes = (value: string) => {
  const digitsOnly = value.replace(/\D/g, '').slice(0, 8);

  if (digitsOnly.length <= 2) return digitsOnly;
  if (digitsOnly.length <= 4) {
    return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
  }

  return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4)}`;
};

const handleStartDateTextChange = (text: string) => {
  const formatted = formatInputWithSlashes(text);
  setStartDateText(formatted);

  const parsed = parseDateString(formatted);
  if (parsed) {
    setStartDateValue(parsed);
  }
};

const handleEndDateTextChange = (text: string) => {
  const formatted = formatInputWithSlashes(text);
  setEndDateText(formatted);

  const parsed = parseDateString(formatted);
  if (parsed) {
    setEndDateValue(parsed);
  }
};

const handleStartPickerChange = (event: any, selectedDate?: Date) => {
  setShowStartPicker(false);

  if (event?.type !== 'set' || !selectedDate) {
    return;
  }

  setStartDateValue(selectedDate);
  setStartDateText(formatDate(selectedDate));

  if (endDateValue && selectedDate > endDateValue) {
    setEndDateValue(selectedDate);
    setEndDateText(formatDate(selectedDate));
  }
};

const handleEndPickerChange = (event: any, selectedDate?: Date) => {
  setShowEndPicker(false);

  if (event?.type !== 'set' || !selectedDate) {
    return;
  }

  setEndDateValue(selectedDate);
  setEndDateText(formatDate(selectedDate));
};

  const renderSelect = (
    label: string,
    valueLabel: string,
    selectKey: Exclude<OpenSelect, null>,
    options: SelectOption[],
    onSelect: (value: string) => void
  ) => {
    const isOpen = openSelect === selectKey;

    return (
      <View style={styles.selectBlock}>
        <Text style={styles.fieldLabel}>{label}</Text>

        <Pressable
          style={[styles.selectField, isOpen && styles.selectFieldOpen]}
          onPress={() => setOpenSelect(isOpen ? null : selectKey)}
        >
          <Text style={styles.selectValue}>{valueLabel}</Text>
          <Ionicons name="chevron-down" size={18} color="#A1A1AA" />
        </Pressable>

        {isOpen ? (
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
                  {isSelected ? <Ionicons name="checkmark" size={20} color="#6B7280" /> : <View style={styles.checkPlaceholder} />}
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={closeAllDropdowns}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <MaterialCommunityIcons name="office-building-outline" size={24} color="#FFFFFF" />
              </View>

              <View style={styles.headerTextWrap}>
                <Text style={styles.headerTitle}>סאבלטים זמינים - ללא תיווך</Text>
                <Text style={styles.headerSubtitle}>מצא את הדירה המושלמת</Text>
              </View>
            </View>

            <Pressable style={styles.headerAction}>
              <Ionicons name="globe-outline" size={24} color="#111111" />
            </Pressable>
          </View>

          <View style={styles.body}>
            <View style={styles.searchWrapper}>
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="חפש..."
                placeholderTextColor="#A1A1AA"
                style={styles.searchInput}
                textAlign="right"
              />
              <Ionicons name="search-outline" size={22} color="#9CA3AF" style={styles.searchIcon} />
            </View>

            <View style={styles.card}>
              <Pressable
                style={styles.cardHeaderRow}
                onPress={() => {
                  setIsDatesOpen((prev) => !prev);
                  closeAllDropdowns();
                }}
              >
                <Ionicons
                  name={isDatesOpen ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color="#2563EB"
                />
                <View style={styles.cardHeaderTextWrap}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>תאריכים</Text>
                    <Ionicons name="calendar-outline" size={24} color="#2563EB" />
                  </View>
                  <Text style={styles.cardHelperText}>בחר תאריכים כדי לראות סאבלטים זמינים</Text>
                </View>
              </Pressable>

              {isDatesOpen ? (
                <View style={styles.cardContent}>

                <View style={styles.fieldBlock}>
  <Text style={styles.fieldLabel}>מתאריך</Text>

  <View style={styles.dateField}>
    <TextInput
      style={styles.dateInput}
      value={startDateText}
      onChangeText={handleStartDateTextChange}
      placeholder="dd/mm/yyyy"
      placeholderTextColor="#6B7280"
      keyboardType="number-pad"
      textAlign="right"
    />

    <Pressable onPress={() => setShowStartPicker(true)}>
      <Ionicons name="calendar-outline" size={22} color="#111111" />
    </Pressable>
  </View>

  {showStartPicker ? (
    <DateTimePicker
      value={startDateValue ?? new Date()}
      mode="date"
      display="default"
      onChange={handleStartPickerChange}
      minimumDate={new Date()}
    />
  ) : null}
</View>

<View style={styles.fieldBlock}>
  <Text style={styles.fieldLabel}>עד תאריך</Text>

  <View style={styles.dateField}>
    <TextInput
      style={styles.dateInput}
      value={endDateText}
      onChangeText={handleEndDateTextChange}
      placeholder="dd/mm/yyyy"
      placeholderTextColor="#6B7280"
      keyboardType="number-pad"
      textAlign="right"
    />

    <Pressable onPress={() => setShowEndPicker(true)}>
      <Ionicons name="calendar-outline" size={22} color="#111111" />
    </Pressable>
  </View>
       <View style={styles.clearDatesRow}>
         <Pressable onPress={clearDates} style={styles.clearDatesButton}>
           <Text style={styles.clearDatesButtonText}>נקה</Text>
         </Pressable>
       </View>

  {showEndPicker ? (
    <DateTimePicker
      value={endDateValue ?? startDateValue ?? new Date()}
      mode="date"
      display="default"
      onChange={handleEndPickerChange}
      minimumDate={startDateValue ?? new Date()}

    />
  ) : null}
</View>
                </View>
              ) : null}
            </View>

            <View style={styles.card}>
              <Pressable
                style={styles.cardHeaderRow}
                onPress={() => {
                  setIsAdditionalFiltersOpen((prev) => !prev);
                  closeAllDropdowns();
                }}
              >
                <Ionicons
                  name={isAdditionalFiltersOpen ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color="#111111"
                />
                <View style={styles.cardHeaderTextWrap}>
                  <Text style={styles.additionalFiltersTitle}>פילטרים נוספים</Text>
                </View>
              </Pressable>

              {isAdditionalFiltersOpen ? (
                <View style={styles.additionalFiltersContent}>
                  {renderSelect(
                    'מיקום',
                    locationLabel,
                    'location',
                    LOCATION_OPTIONS,
                    setLocation
                  )}

                  {renderSelect(
                    'חדרים',
                    roomsLabel,
                    'rooms',
                    ROOM_OPTIONS,
                    setRooms
                  )}

                  {renderSelect(
                    'שותפים',
                    partnersLabel,
                    'partners',
                    PARTNER_OPTIONS,
                    setPartners
                  )}

                  <View style={styles.priceBlock}>
                    <Text style={styles.fieldLabel}>מחיר</Text>
                    <Text style={styles.priceRangeLabel}>
                       ₪{priceRange[0].toLocaleString()} - ₪{priceRange[1].toLocaleString()}
                       </Text>
                    <View style={styles.realSliderWrapper}>
                      <Slider
                        value={priceRange}
                        onValueChange={(values) => {
                          const next = Array.isArray(values) ? values : [MIN_ALLOWED_PRICE, MAX_ALLOWED_PRICE];
                          setPriceRange([Math.round(next[0]), Math.round(next[1])]);
                        }}
                        minimumValue={MIN_ALLOWED_PRICE}
                        maximumValue={MAX_ALLOWED_PRICE}
                        step={500}
                        minimumTrackTintColor="#020617"
                        maximumTrackTintColor="#E5E7EB"
                        thumbTintColor="#FFFFFF"
                        trackStyle={styles.realSliderTrack}
                        thumbStyle={styles.realSliderThumb}
                        containerStyle={styles.realSliderContainer}
                      />

                    </View>
                  </View>

                  <View style={styles.divider} />

                  <Text style={styles.sectionLabel}>מתקנים</Text>
                  <View style={styles.checkboxGrid}>
                    <View style={styles.checkboxColumn}>
                      <CheckboxRow
                        label={AMENITY_LABELS.safeRoom}
                        checked={selectedAmenities.safeRoom}
                        onPress={() => toggleAmenity('safeRoom')}
                        icon="shield-checkmark-outline"
                      />
                      <CheckboxRow
                        label={AMENITY_LABELS.washingMachine}
                        checked={selectedAmenities.washingMachine}
                        onPress={() => toggleAmenity('washingMachine')}
                        icon="shirt-outline"
                      />
                      <CheckboxRow
                        label={AMENITY_LABELS.furnished}
                        checked={selectedAmenities.furnished}
                        onPress={() => toggleAmenity('furnished')}
                        icon="bed-outline"
                      />
                      <CheckboxRow
                        label={AMENITY_LABELS.petFriendly}
                        checked={selectedAmenities.petFriendly}
                        onPress={() => toggleAmenity('petFriendly')}
                        icon="paw-outline"
                      />
                    </View>

                    <View style={styles.checkboxColumn}>
                      <CheckboxRow
                        label={AMENITY_LABELS.airConditioning}
                        checked={selectedAmenities.airConditioning}
                        onPress={() => toggleAmenity('airConditioning')}
                        icon="snow-outline"
                      />
                      <CheckboxRow
                        label={AMENITY_LABELS.elevator}
                        checked={selectedAmenities.elevator}
                        onPress={() => toggleAmenity('elevator')}
                        icon="swap-vertical-outline"
                      />
                      <CheckboxRow
                        label={AMENITY_LABELS.storage}
                        checked={selectedAmenities.storage}
                        onPress={() => toggleAmenity('storage')}
                        icon="cube-outline"
                      />
                      <CheckboxRow
                        label={AMENITY_LABELS.parking}
                        checked={selectedAmenities.parking}
                        onPress={() => toggleAmenity('parking')}
                        icon="car-outline"
                      />
                    </View>
                  </View>

                  {renderSelect(
                    'הרכב השותפים',
                    roommateTypeLabel,
                    'roommateType',
                    ROOMMATE_TYPE_OPTIONS,
                    setRoommateType
                  )}

                  <Text style={styles.sectionLabel}>אופי הדירה</Text>
                  <View style={styles.apartmentFeatureList}>
                    <CheckboxRow
                      label={APARTMENT_FEATURE_LABELS.youngAndLively}
                      checked={selectedApartmentFeatures.youngAndLively}
                      onPress={() => toggleApartmentFeature('youngAndLively')}
                    />
                    <CheckboxRow
                      label={APARTMENT_FEATURE_LABELS.quiet}
                      checked={selectedApartmentFeatures.quiet}
                      onPress={() => toggleApartmentFeature('quiet')}
                    />
                    <CheckboxRow
                      label={APARTMENT_FEATURE_LABELS.studyFriendly}
                      checked={selectedApartmentFeatures.studyFriendly}
                      onPress={() => toggleApartmentFeature('studyFriendly')}
                    />
                    <CheckboxRow
                      label={APARTMENT_FEATURE_LABELS.sabbathKeepers}
                      checked={selectedApartmentFeatures.sabbathKeepers}
                      onPress={() => toggleApartmentFeature('sabbathKeepers')}
                    />
                    <CheckboxRow
                      label={APARTMENT_FEATURE_LABELS.traditional}
                      checked={selectedApartmentFeatures.traditional}
                      onPress={() => toggleApartmentFeature('traditional')}
                    />
                  </View>
                </View>
              ) : null}
            </View>

            <View style={styles.listingHeader}>
              <View>
                <Text style={styles.listingTitle}>דירות זמינות</Text>
                <Text style={styles.listingSubtitle}>
                  {loading ? 'טוען...' : `נמצאו ${sublets.length} דירות`}
                </Text>
              </View>

              <View style={styles.viewToggle}>
                <Pressable style={styles.viewToggleButton}>
                  <Ionicons name="grid-outline" size={22} color="#111111" />
                </Pressable>
                <Pressable style={styles.viewToggleButton}>
                  <Ionicons name="map-outline" size={22} color="#111111" />
                </Pressable>
              </View>
            </View>

            <View style={styles.mapCard}>
              {loading ? (
                <View style={styles.mapLoading}>
                  <ActivityIndicator size="large" color="#2563EB" />
                  <Text style={styles.mapLoadingText}>טוען מפה...</Text>
                </View>
              ) : (
                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.map}
                    provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                    initialRegion={ISRAEL_REGION}
                    showsUserLocation={false}
                  >
                    {mappableSublets.map((sublet) => (
                      <Marker
                        key={sublet.id}
                        coordinate={{ latitude: sublet.lat!, longitude: sublet.lng! }}
                        title={sublet.title}
                        description={`₪${sublet.price_per_month.toLocaleString()} לחודש`}
                        pinColor={getMarkerColor(sublet.available_from)}
                      />
                    ))}
                  </MapView>

                  <View style={styles.mapLegend}>
                    <View style={styles.legendHeaderRow}>
                      <Text style={styles.legendTitle}>מקרא זמינות</Text>
                      <Ionicons name="information-circle-outline" size={18} color="#374151" />
                    </View>

                    {LEGEND_ITEMS.map((item) => (
                      <View key={item.label} style={styles.legendRow}>
                        <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                        <Text style={styles.legendText}>{item.label}</Text>
                      </View>
                    ))}
                  </View>

                  {sublets.length === 0 && (
                    <View style={styles.noResultsOverlay}>
                      <Ionicons name="search-outline" size={32} color="#9CA3AF" />
                      <Text style={styles.noResultsText}>לא נמצאו דירות</Text>
                      <Text style={styles.noResultsSubtext}>נסה לשנות את הפילטרים</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* City carousels */}
            {!loading && subletsByCity.length > 0 && (
              <View style={styles.carouselSection}>
                {subletsByCity.map(([city, citySublets]) => (
                  <View key={city} style={styles.cityGroup}>
                    <View style={styles.cityHeaderRow}>
                      <View style={styles.cityBadge}>
                        <Ionicons name="location" size={16} color="#7B2FBE" />
                        <Text style={styles.cityTitle}>{city}</Text>
                      </View>
                      <Text style={styles.cityCount}>{citySublets.length} דירות</Text>
                    </View>

                    <FlatList
                      data={citySublets}
                      horizontal
                      inverted
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.carouselContent}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item: sublet }) => {
                        const hasImg = sublet.images && sublet.images.length > 0;
                        return (
                          <Pressable
                            style={styles.hCard}
                            onPress={() => router.push(`/sublet/${sublet.id}` as any)}
                          >
                            {hasImg ? (
                              <Image source={{ uri: sublet.images![0] }} style={styles.hCardImage} />
                            ) : (
                              <View style={styles.hCardImagePlaceholder}>
                                <Ionicons name="home-outline" size={32} color="#D1D5DB" />
                              </View>
                            )}
                            <View style={styles.hCardBody}>
                              <Text style={styles.hCardTitle} numberOfLines={1}>{sublet.title}</Text>
                              <Text style={styles.hCardLocation} numberOfLines={1}>
                                {sublet.neighborhood ? `${sublet.neighborhood} · ` : ''}{city}
                              </Text>
                              <View style={styles.hCardStats}>
                                {sublet.num_rooms != null && (
                                  <Text style={styles.hCardStat}>{sublet.num_rooms} חד׳</Text>
                                )}
                                {sublet.area_sqm != null && (
                                  <Text style={styles.hCardStat}>{sublet.area_sqm} מ"ר</Text>
                                )}
                              </View>
                              <Text style={styles.hCardDates}>
                                {formatCardDate(sublet.available_from)} — {formatCardDate(sublet.available_until)}
                              </Text>
                              <Text style={styles.hCardPrice}>
                                {sublet.price_per_month.toLocaleString()} ₪ לחודש
                              </Text>
                            </View>
                          </Pressable>
                        );
                      }}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <Pressable style={styles.postButton} onPress={() => router.push('/modal')}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
          <Text style={styles.postButtonText}>+ פרסם סאבלט</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

type CheckboxRowProps = {
  label: string;
  checked: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
};

function CheckboxRow({ label, checked, onPress, icon }: CheckboxRowProps) {
  return (
    <Pressable style={styles.checkboxRow} onPress={onPress}>
      <View style={styles.checkboxRightSide}>
        {icon ? <Ionicons name={icon} size={17} color="#111111" style={styles.checkboxIcon} /> : null}
        <Text style={styles.checkboxLabel}>{label}</Text>
      </View>

      <View style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]}>
        {checked ? <Ionicons name="checkmark" size={16} color="#2563EB" /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({

clearDatesRow: {
  flexDirection: 'row',
  justifyContent: 'flex-end',
  marginTop: 8,
},

clearDatesButton: {
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 8,
},

clearDatesButtonText: {
  fontSize: 14,
  color: '#2563EB',
  fontWeight: '600',
  textAlign: 'right',
},
  dateInput: {
  flex: 1,
  fontSize: 16,
  color: '#111111',
  paddingRight: 12,
  textAlign: 'right',
},
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  header: {
    backgroundColor: '#FFFFFF',
    minHeight: 112,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#D4D4D8',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  headerTextWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerIcon: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'right',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 18,
    lineHeight: 24,
    color: '#4B5563',
    textAlign: 'right',
  },
  headerAction: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 26,
  },
  searchWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  searchInput: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#EFEFF1',
    paddingHorizontal: 18,
    paddingRight: 46,
    fontSize: 16,
    color: '#111111',
    textAlign: 'right',
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    top: 14,
  },
  card: {
    backgroundColor: '#FAFAFA',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D4D4D8',
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 18,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardHeaderTextWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  cardTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'right',
  },
  additionalFiltersTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'right',
  },
  cardHelperText: {
    fontSize: 16,
    color: '#2563EB',
    textAlign: 'right',
  },
  cardContent: {
    marginTop: 20,
    gap: 18,
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
    textAlign: 'right',
  },
  dateField: {
    height: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#93C5FD',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
    color: '#111111',
    textAlign: 'right',
  },
  additionalFiltersContent: {
    marginTop: 18,
  },
  selectBlock: {
    marginBottom: 16,
  },
  selectField: {
    minHeight: 58,
    borderRadius: 14,
    backgroundColor: '#EFEFF1',
    paddingHorizontal: 18,
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
    fontSize: 18,
    color: '#111111',
    textAlign: 'right',
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
    minHeight: 56,
    paddingHorizontal: 18,
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
    fontSize: 18,
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
  priceBlock: {
    marginBottom: 18,
  },
  priceRangeLabel: {
    marginTop: 10,
    marginBottom: 8,
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'right',
  },
  sliderTrack: {
    height: 16,
    justifyContent: 'center',
  },
  sliderFill: {
    height: 12,
    borderRadius: 999,
    backgroundColor: '#020617',
  },
  sliderThumbLeft: {
    position: 'absolute',
    left: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#111827',
  },
  sliderThumbRight: {
    position: 'absolute',
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'right',
    marginBottom: 14,
    width: '100%',
  },
  checkboxGrid: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 18,
  },
  checkboxColumn: {
    flex: 1,
    gap: 12,
  },
  checkboxRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkboxRightSide: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flexShrink: 1,
    gap: 6,
  },
  checkboxIcon: {
    marginTop: 1,
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
  apartmentFeatureList: {
    gap: 12,
  },
  listingHeader: {
    marginTop: 10,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  listingTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'right',
  },
  listingSubtitle: {
    marginTop: 4,
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'right',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#EFEFF1',
    borderRadius: 20,
    padding: 4,
    gap: 2,
  },
  viewToggleButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  mapContainer: {
    height: 560,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapLoading: {
    height: 560,
    borderRadius: 20,
    backgroundColor: '#E7EFE3',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  mapLoadingText: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'right',
  },
  noResultsOverlay: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 4,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'right',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
  },
  mapLegend: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    width: 210,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  legendHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
    marginBottom: 10,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'right',
  },
  legendRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'right',
  },
  postButton: {
    position: 'absolute',
    right: 18,
    bottom: 22,
    height: 64,
    borderRadius: 18,
    paddingHorizontal: 22,
    backgroundColor: '#A21CAF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  postButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  realSliderWrapper: {
    marginTop: 6,
  },

  realSliderContainer: {
    height: 34,
    justifyContent: 'center',
  },

  realSliderTrack: {
    height: 12,
    borderRadius: 999,
  },

  realSliderThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#111827',
  },
  carouselSection: {
    marginTop: 24,
    gap: 24,
  },
  cityGroup: {
    gap: 10,
  },
  cityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cityTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'right',
  },
  cityCount: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  carouselContent: {
    paddingLeft: 16,
    gap: 12,
  },
  hCard: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  hCardImage: {
    width: '100%',
    height: 140,
  },
  hCardImagePlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hCardBody: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  hCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'right',
  },
  hCardLocation: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'right',
  },
  hCardStats: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  hCardStat: {
    fontSize: 11,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
    textAlign: 'right',
  },
  hCardDates: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 2,
  },
  hCardPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: '#22C55E',
    textAlign: 'right',
    marginTop: 4,
  },
})