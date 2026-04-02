import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import type { Sublet } from '@/lib/hooks/useSublets';

function fmt(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function price(n: number) {
  return `₪${n.toLocaleString('he-IL')}`;
}

export default function SubletDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [sublet, setSublet] = useState<Sublet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const { data, error: err } = await supabase
        .from('sublets')
        .select('*')
        .eq('id', id)
        .single();

      if (err) {
        setError(err.message);
      } else {
        setSublet(data);
      }
      setLoading(false);
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return <LoadingScreen message="טוען פרטי דירה..." />;
  }

  if (error || !sublet) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorCenter}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>לא ניתן לטעון את הדירה</Text>
          <Text style={styles.errorSub}>{error || 'הדירה לא נמצאה'}</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>חזור</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const hasImage = sublet.images && sublet.images.length > 0;
  const durationMonths = sublet.duration_months ?? (() => {
    const from = new Date(sublet.available_from);
    const to = new Date(sublet.available_until);
    return Math.max(1, Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  })();
  const totalPrice = sublet.price_per_month * durationMonths;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header bar */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerClose}>
          <Ionicons name="close" size={26} color="#4B5563" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{sublet.title}</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>סאבלט</Text>
        </View>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image */}
        {hasImage ? (
          <Image source={{ uri: sublet.images![0] }} style={styles.heroImage} />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Ionicons name="home-outline" size={48} color="#D1D5DB" />
          </View>
        )}

        {/* Price + Location */}
        <View style={styles.section}>
          <Text style={styles.priceText}>{price(sublet.price_per_month)} לחודש</Text>
          <Text style={styles.totalPrice}>
            סה"כ לתקופה: {price(totalPrice)} | {durationMonths} חודשים
          </Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={18} color="#6B7280" />
            <Text style={styles.locationText}>
              {[sublet.neighborhood, sublet.city].filter(Boolean).join(' – ')}
            </Text>
          </View>
          {sublet.address && (
            <Text style={styles.addressText}>{sublet.address}</Text>
          )}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {sublet.num_rooms != null && (
            <View style={styles.statItem}>
              <Ionicons name="bed-outline" size={20} color="#7B2FBE" />
              <Text style={styles.statValue}>{sublet.num_rooms}</Text>
              <Text style={styles.statLabel}>חדרים</Text>
            </View>
          )}
          {sublet.num_bathrooms != null && (
            <View style={styles.statItem}>
              <Ionicons name="water-outline" size={20} color="#7B2FBE" />
              <Text style={styles.statValue}>{sublet.num_bathrooms}</Text>
              <Text style={styles.statLabel}>מקלחות</Text>
            </View>
          )}
          {sublet.area_sqm != null && (
            <View style={styles.statItem}>
              <Ionicons name="resize-outline" size={20} color="#7B2FBE" />
              <Text style={styles.statValue}>{sublet.area_sqm}</Text>
              <Text style={styles.statLabel}>מ"ר</Text>
            </View>
          )}
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={20} color="#7B2FBE" />
            <Text style={styles.statValue}>{fmt(sublet.available_from)}</Text>
            <Text style={styles.statLabel}>פנוי מ-</Text>
          </View>
        </View>

        {/* Dates card */}
        <View style={styles.datesCard}>
          <View style={styles.datesCardHeader}>
            <Ionicons name="calendar" size={20} color="#2563EB" />
            <Text style={styles.datesCardTitle}>תאריכי זמינות</Text>
          </View>
          <View style={styles.datesValues}>
            <Text style={styles.datesLabel}>מתאריך: <Text style={styles.datesValue}>{fmt(sublet.available_from)}</Text></Text>
            <Text style={styles.datesLabel}>עד תאריך: <Text style={styles.datesValue}>{fmt(sublet.available_until)}</Text></Text>
          </View>
          <Text style={styles.datesDuration}>משך השכרה: {durationMonths} חודשים</Text>
        </View>

        {/* Description */}
        {sublet.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>תיאור</Text>
            <Text style={styles.descriptionText}>{sublet.description}</Text>
          </View>
        ) : null}

        {/* Roommates */}
        {sublet.num_roommates > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>שותפים</Text>
            <Text style={styles.infoText}>
              {sublet.num_roommates} שותפים · הרכב: {sublet.roommate_gender}
            </Text>
          </View>
        )}

        {/* Amenities */}
        {sublet.amenities && sublet.amenities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>שירותים ומתקנים</Text>
            <View style={styles.amenitiesGrid}>
              {sublet.amenities.map((a, i) => (
                <View key={i} style={styles.amenityBadge}>
                  <View style={styles.amenityDot} />
                  <Text style={styles.amenityText}>{a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Vibe */}
        {sublet.apartment_vibe && sublet.apartment_vibe.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>אופי הדירה</Text>
            <View style={styles.amenitiesGrid}>
              {sublet.apartment_vibe.map((v, i) => (
                <View key={i} style={styles.vibeBadge}>
                  <Text style={styles.vibeText}>{v}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Publisher / Contact */}
        <View style={styles.publisherCard}>
          <View style={styles.publisherRow}>
            <Ionicons name="person-circle-outline" size={28} color="#92400E" />
            <Text style={styles.publisherTitle}>מפרסם</Text>
          </View>
          {user ? (
            <Pressable style={styles.contactBtn}>
              <Ionicons name="chatbubble-outline" size={18} color="#FFFFFF" />
              <Text style={styles.contactBtnText}>צור קשר עם המפרסם</Text>
            </Pressable>
          ) : (
            <>
              <Text style={styles.publisherNote}>
                כדי ליצור קשר עם המפרסם, יש להתחבר תחילה
              </Text>
              <Pressable
                style={styles.loginBtn}
                onPress={() => router.push('/modal')}
              >
                <Text style={styles.loginBtnText}>התחבר כדי ליצור קשר</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerClose: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7B2FBE',
  },

  // Hero
  heroImage: {
    width: '100%',
    height: 220,
  },
  heroPlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'right',
    marginBottom: 12,
  },

  // Price / Location
  priceText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22C55E',
    textAlign: 'right',
  },
  totalPrice: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  locationText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'right',
  },
  addressText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },

  // Stats
  statsRow: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Dates card
  datesCard: {
    marginHorizontal: 20,
    marginVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#93C5FD',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  datesCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  datesCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E40AF',
  },
  datesValues: {
    gap: 6,
  },
  datesLabel: {
    fontSize: 15,
    color: '#374151',
    textAlign: 'right',
  },
  datesValue: {
    fontWeight: '700',
    color: '#111111',
  },
  datesDuration: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    textAlign: 'right',
  },

  // Description
  descriptionText: {
    fontSize: 15,
    color: '#374151',
    textAlign: 'right',
    lineHeight: 24,
  },
  infoText: {
    fontSize: 15,
    color: '#374151',
    textAlign: 'right',
  },

  // Amenities
  amenitiesGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
  },
  amenityBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  amenityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  amenityText: {
    fontSize: 14,
    color: '#166534',
  },
  vibeBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  vibeText: {
    fontSize: 14,
    color: '#7B2FBE',
  },

  // Publisher
  publisherCard: {
    marginHorizontal: 20,
    marginVertical: 12,
    backgroundColor: '#FFF8E7',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  publisherRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  publisherTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
  },
  publisherNote: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'right',
    marginBottom: 12,
    lineHeight: 20,
  },
  contactBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7B2FBE',
    borderRadius: 12,
    paddingVertical: 14,
  },
  contactBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loginBtn: {
    backgroundColor: '#111111',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Error
  errorCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  errorSub: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 8,
    backgroundColor: '#7B2FBE',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
