import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ: FaqItem[] = [
  {
    question: 'איך מפרסמים סאבלט?',
    answer: 'לחצו על הטאב "פרסם" בתחתית המסך, מלאו את כל הפרטים הנדרשים ולחצו "פרסם מודעה". המודעה תופיע מיד במפה ובחיפוש.',
  },
  {
    question: 'איך יוצרים קשר עם מפרסם?',
    answer: 'לחצו על דירה שמעניינת אתכם, גללו למטה ולחצו על "צור קשר עם המפרסם". יש להיות מחוברים לחשבון כדי ליצור קשר.',
  },
  {
    question: 'האם יש עמלה או תשלום?',
    answer: 'לא! האפליקציה חינמית לחלוטין, ללא עמלות וללא מתווכים. המטרה היא לחבר ישירות בין דיירים למשכירים.',
  },
  {
    question: 'איך שומרים דירה למועדפים?',
    answer: 'לחצו על סמן במפה ולחצו על כפתור הלב, או גללו לכרטיסי הדירות ולחצו על הלב. הדירות השמורות מופיעות בטאב "שמורים".',
  },
  {
    question: 'איך עורכים או מוחקים מודעה?',
    answer: 'כנסו לפרופיל שלכם, שם תוכלו לראות את כל המודעות שפרסמתם ולערוך או למחוק אותן.',
  },
  {
    question: 'מה לעשות אם שכחתי סיסמה?',
    answer: 'בדף ההתחברות, הזינו את האימייל שלכם והירשמו מחדש — תקבלו מייל אימות חדש.',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-forward" size={24} color="#111" />
        </Pressable>
        <Text style={s.headerTitle}>קבל עזרה</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={s.flex} contentContainerStyle={s.scroll}>
        {/* Contact card */}
        <View style={s.contactCard}>
          <View style={s.contactIconWrap}>
            <Ionicons name="chatbubbles-outline" size={32} color="#7B2FBE" />
          </View>
          <Text style={s.contactTitle}>צריך עזרה?</Text>
          <Text style={s.contactText}>
            אנחנו כאן בשבילך. שלח לנו הודעה ונחזור אליך בהקדם.
          </Text>
          <Pressable
            style={s.contactBtn}
            onPress={() => Linking.openURL('mailto:support@sublet-app.co.il?subject=עזרה')}
          >
            <Ionicons name="mail-outline" size={18} color="#FFF" />
            <Text style={s.contactBtnText}>שלח אימייל</Text>
          </Pressable>
        </View>

        {/* FAQ */}
        <Text style={s.faqHeader}>שאלות נפוצות</Text>

        <View style={s.faqCard}>
          {FAQ.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <View key={i} style={[s.faqItem, i < FAQ.length - 1 && s.faqBorder]}>
                <Pressable
                  style={s.faqQuestion}
                  onPress={() => setOpenIndex(isOpen ? null : i)}
                >
                  <View style={s.faqQuestionLeft}>
                    <View style={s.faqDot} />
                    <Text style={s.faqQuestionText}>{item.question}</Text>
                  </View>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#9CA3AF"
                  />
                </Pressable>
                {isOpen && (
                  <Text style={s.faqAnswer}>{item.answer}</Text>
                )}
              </View>
            );
          })}
        </View>
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

  // Contact card
  contactCard: {
    marginTop: 20, backgroundColor: '#FFF', borderRadius: 20,
    paddingHorizontal: 22, paddingVertical: 28, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  contactIconWrap: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: '#F3E8FF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  contactTitle: { fontSize: 20, fontWeight: '700', color: '#111', textAlign: 'center', marginBottom: 6 },
  contactText: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 18 },
  contactBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#7B2FBE', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28,
  },
  contactBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // FAQ
  faqHeader: {
    fontSize: 20, fontWeight: '700', color: '#111', textAlign: 'right', marginTop: 28, marginBottom: 14,
  },
  faqCard: {
    backgroundColor: '#FFF', borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  faqItem: { paddingHorizontal: 18, paddingVertical: 16 },
  faqBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  faqQuestion: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
  },
  faqQuestionLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, flex: 1, marginLeft: 8 },
  faqDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#7B2FBE' },
  faqQuestionText: { fontSize: 16, fontWeight: '600', color: '#111', textAlign: 'right', flex: 1 },
  faqAnswer: {
    marginTop: 12, fontSize: 15, color: '#4B5563', textAlign: 'right', lineHeight: 24,
    paddingRight: 18,
  },
});
