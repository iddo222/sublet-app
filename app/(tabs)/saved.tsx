import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSavedSublets } from '@/lib/hooks/useSavedSublets';
import type { Sublet } from '@/lib/hooks/useSublets';
import { LoadingScreen, EmptyState } from '@/components/ui/LoadingScreen';

// ── Helpers ───────────────────────────────────────────────────
function formatDate(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function formatPrice(n: number) {
  return `₪${n.toLocaleString('he-IL')}`;
}

// ══════════════════════════════════════════════════════════════
export default function SavedScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return <LoadingScreen message="טוען..." />;
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <View style={styles.guestIconCircle}>
            <Ionicons name="heart-outline" size={52} color="#7B2FBE" />
          </View>
          <Text style={styles.guestTitle}>שמור דירות שאהבת</Text>
          <Text style={styles.guestSubtitle}>
            התחבר כדי לשמור סאבלטים ולהשוות ביניהם
          </Text>
          <Pressable style={styles.guestButton} onPress={() => router.push('/modal')}>
            <Ionicons name="log-in-outline" size={22} color="#FFFFFF" />
            <Text style={styles.guestButtonText}>התחבר / הירשם</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return <SavedList userId={user.id} />;
}

// ── Inner component (hooks safe) ─────────────────────────────
function SavedList({ userId }: { userId: string }) {
  const { savedSublets, loading, toggleSave } = useSavedSublets(userId);

  if (loading) {
    return <LoadingScreen message="טוען דירות שמורות..." submessage="רגע, מביאים את הרשימה שלך" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Header ──────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Ionicons name="heart" size={24} color="#7B2FBE" />
          <Text style={styles.headerTitle}>דירות שמורות</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {savedSublets.length === 0
            ? 'עדיין לא שמרת דירות'
            : `${savedSublets.length} דירות שמורות`}
        </Text>
      </View>

      {savedSublets.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="אין דירות שמורות"
          subtitle="לחץ על הלב במפה כדי לשמור דירות שמעניינות אותך ולהשוות ביניהן"
        />
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {savedSublets.map((sublet) => (
            <SavedCard
              key={sublet.id}
              sublet={sublet}
              onUnsave={() => toggleSave(sublet.id)}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Card component ───────────────────────────────────────────
function SavedCard({
  sublet,
  onUnsave,
}: {
  sublet: Sublet;
  onUnsave: () => void;
}) {
  const hasImage = sublet.images && sublet.images.length > 0;

  return (
    <View style={styles.card}>
      {/* Image or placeholder */}
      <View style={styles.cardImageWrap}>
        {hasImage ? (
          <Image source={{ uri: sublet.images![0] }} style={styles.cardImage} />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Ionicons name="home-outline" size={36} color="#D1D5DB" />
          </View>
        )}

        {/* Heart button overlaid on image */}
        <Pressable style={styles.heartButton} onPress={onUnsave}>
          <Ionicons name="heart" size={22} color="#EF4444" />
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {sublet.title}
        </Text>

        {/* Location */}
        <View style={styles.cardInfoRow}>
          <Ionicons name="location-outline" size={16} color="#6B7280" />
          <Text style={styles.cardInfoText} numberOfLines={1}>
            {[sublet.neighborhood, sublet.city].filter(Boolean).join(' · ')}
          </Text>
        </View>

        {/* Dates */}
        <View style={styles.cardInfoRow}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={styles.cardInfoText}>
            {formatDate(sublet.available_from)} — {formatDate(sublet.available_until)}
          </Text>
        </View>

        {/* Stats row */}
        <View style={styles.cardStatsRow}>
          {sublet.num_rooms != null && (
            <View style={styles.cardStat}>
              <Ionicons name="bed-outline" size={14} color="#6B7280" />
              <Text style={styles.cardStatText}>{sublet.num_rooms} חדרים</Text>
            </View>
          )}
          {sublet.area_sqm != null && (
            <View style={styles.cardStat}>
              <Ionicons name="resize-outline" size={14} color="#6B7280" />
              <Text style={styles.cardStatText}>{sublet.area_sqm} מ"ר</Text>
            </View>
          )}
        </View>

        {/* Price */}
        <Text style={styles.cardPrice}>{formatPrice(sublet.price_per_month)} לחודש</Text>
      </View>
    </View>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // ── Guest state ────────────────────────────────────────────
  guestIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  guestButton: {
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
  guestButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  // ── Header ─────────────────────────────────────────────────
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'right',
  },

  // ── Empty state ────────────────────────────────────────────
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Card ───────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardImageWrap: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'right',
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardInfoText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
    flexShrink: 1,
  },
  cardStatsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 2,
  },
  cardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardStatText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'right',
  },
  cardPrice: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '700',
    color: '#22C55E',
    textAlign: 'right',
  },
});
