import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

// ── Types ─────────────────────────────────────────────────────
interface ProfileData {
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface MenuRow {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  showChevron?: boolean;
}

// ══════════════════════════════════════════════════════════════
export default function ProfileScreen() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();

  // ── Not logged in ──────────────────────────────────────────
  if (authLoading) {
    return <LoadingScreen message="טוען פרופיל..." />;
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <View style={styles.guestIconCircle}>
            <Ionicons name="person-outline" size={52} color="#7B2FBE" />
          </View>
          <Text style={styles.guestTitle}>עדיין לא התחברת</Text>
          <Text style={styles.guestSubtitle}>
            התחבר כדי לנהל את הפרופיל שלך, לפרסם סאבלטים ולשמור מודעות
          </Text>
          <Pressable style={styles.guestButton} onPress={() => router.push('/modal')}>
            <Ionicons name="log-in-outline" size={22} color="#FFFFFF" />
            <Text style={styles.guestButtonText}>התחבר / הירשם</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return <AuthenticatedProfile userId={user.id} />;
}

// ── Authenticated inner component ────────────────────────────
function AuthenticatedProfile({ userId }: { userId: string }) {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [listingsCount, setListingsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, phone, avatar_url, created_at')
        .eq('id', userId)
        .single();

      setProfile(profileData);

      // Count user's listings
      const { count } = await supabase
        .from('sublets')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      setListingsCount(count ?? 0);
      setLoading(false);
    }

    load();
  }, [userId]);

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'משתמש';

  const displayEmail = user?.email ?? '';

  const memberSince = profile?.created_at || user?.created_at;
  const memberDuration = memberSince ? getTimeSince(memberSince) : '—';

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  const menuSections: { title: string; rows: MenuRow[] }[] = [
    {
      title: 'כללי',
      rows: [
        {
          icon: 'settings-outline',
          label: 'הגדרות חשבון',
          onPress: () => router.push('/profile/account'),
          showChevron: true,
        },
        {
          icon: 'shield-checkmark-outline',
          label: 'פרטיות',
          onPress: () => router.push('/profile/privacy'),
          showChevron: true,
        },
        {
          icon: 'help-circle-outline',
          label: 'קבל עזרה',
          onPress: () => router.push('/profile/help'),
          showChevron: true,
        },
      ],
    },
    {
      title: '',
      rows: [
        {
          icon: 'log-out-outline',
          label: 'התנתק',
          onPress: handleSignOut,
          color: '#EF4444',
        },
      ],
    },
  ];

  if (loading) {
    return <LoadingScreen message="טוען פרופיל..." submessage="מביאים את הפרטים שלך" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ────────────────────────────────────── */}
        <View style={styles.headerBg}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={44} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{displayEmail}</Text>

          <Pressable style={styles.editButton} onPress={() => router.push('/profile/edit')}>
            <Ionicons name="create-outline" size={18} color="#7B2FBE" />
            <Text style={styles.editButtonText}>ערוך פרופיל</Text>
          </Pressable>
        </View>

        {/* ── Stats ─────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconCircle, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="home-outline" size={22} color="#7B2FBE" />
            </View>
            <Text style={styles.statValue}>{listingsCount}</Text>
            <Text style={styles.statLabel}>מודעות</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="star-outline" size={22} color="#D97706" />
            </View>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>ביקורות</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconCircle, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="time-outline" size={22} color="#2563EB" />
            </View>
            <Text style={styles.statValue}>{memberDuration}</Text>
            <Text style={styles.statLabel}>באפליקציה</Text>
          </View>
        </View>

        {/* ── Menu sections ──────────────────────────────── */}
        {menuSections.map((section, si) => (
          <View key={si} style={styles.menuSection}>
            {section.title ? (
              <Text style={styles.menuSectionTitle}>{section.title}</Text>
            ) : null}

            <View style={styles.menuCard}>
              {section.rows.map((row, ri) => (
                <Pressable
                  key={ri}
                  style={[
                    styles.menuRow,
                    ri < section.rows.length - 1 && styles.menuRowBorder,
                  ]}
                  onPress={row.onPress}
                >
                  <View style={styles.menuRowLeft}>
                    <View
                      style={[
                        styles.menuIconCircle,
                        row.color
                          ? { backgroundColor: '#FEE2E2' }
                          : { backgroundColor: '#F3E8FF' },
                      ]}
                    >
                      <Ionicons
                        name={row.icon}
                        size={20}
                        color={row.color ?? '#7B2FBE'}
                      />
                    </View>
                    <Text
                      style={[
                        styles.menuRowLabel,
                        row.color ? { color: row.color } : null,
                      ]}
                    >
                      {row.label}
                    </Text>
                  </View>

                  {row.showChevron && (
                    <Ionicons name="chevron-back" size={20} color="#D1D5DB" />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {/* ── Footer ────────────────────────────────────── */}
        <Text style={styles.footerText}>סאבלט — ללא תיווך, ללא עמלות</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Helpers ───────────────────────────────────────────────────
function getTimeSince(isoDate: string): string {
  const created = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days < 1) return 'היום';
  if (days === 1) return 'יום';
  if (days < 7) return `${days} ימים`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? 'שבוע' : `${weeks} שבועות`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? 'חודש' : `${months} חודשים`;
  }
  const years = Math.floor(days / 365);
  return years === 1 ? 'שנה' : `${years} שנים`;
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
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
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

  // ── Header / avatar ────────────────────────────────────────
  headerBg: {
    backgroundColor: '#7B2FBE',
    paddingTop: 36,
    paddingBottom: 28,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatarRing: {
    width: 106,
    height: 106,
    borderRadius: 53,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#9B59D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  email: {
    marginTop: 4,
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  editButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7B2FBE',
    textAlign: 'right',
  },

  // ── Stats ──────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  statIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'right',
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'right',
  },

  // ── Menu ───────────────────────────────────────────────────
  menuSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  menuSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
    textAlign: 'right',
    marginBottom: 10,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRowLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
    textAlign: 'right',
  },

  // ── Footer ─────────────────────────────────────────────────
  footerText: {
    marginTop: 32,
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
