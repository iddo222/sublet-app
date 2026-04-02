import { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, REDIRECT_URL } from '../supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
});

async function ensureProfile(user: User) {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!data) {
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: user.user_metadata?.full_name ?? null,
    });
    if (error) {
      console.warn('[Auth] Failed to create profile:', error.message);
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Bootstrap session + listen for changes ─────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        await ensureProfile(s.user);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s?.user) {
        await ensureProfile(s.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Handle deep link redirect after email confirmation ─────
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

  async function handleDeepLink(url: string) {
    console.log('[DeepLink] Received URL:', url);

    // Collect all params from both hash fragment and query string
    const allParams = new URLSearchParams();

    const hashIndex = url.indexOf('#');
    if (hashIndex !== -1) {
      const hashParams = new URLSearchParams(url.substring(hashIndex + 1));
      hashParams.forEach((v, k) => allParams.set(k, v));
    }

    const questionIndex = url.indexOf('?');
    if (questionIndex !== -1) {
      const end = hashIndex !== -1 ? hashIndex : url.length;
      const queryParams = new URLSearchParams(url.substring(questionIndex + 1, end));
      queryParams.forEach((v, k) => allParams.set(k, v));
    }

    const accessToken = allParams.get('access_token');
    const refreshToken = allParams.get('refresh_token');
    const code = allParams.get('code');

    // Method 1: Direct tokens in the URL (implicit flow)
    if (accessToken && refreshToken) {
      console.log('[DeepLink] Found tokens, setting session...');
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) {
        console.warn('[DeepLink] setSession failed:', error.message);
      } else {
        console.log('[DeepLink] Session set successfully');
      }
      return;
    }

    // Method 2: Authorization code (PKCE flow)
    if (code) {
      console.log('[DeepLink] Found auth code, exchanging...');
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.warn('[DeepLink] exchangeCodeForSession failed:', error.message);
      } else {
        console.log('[DeepLink] Code exchanged, session set');
      }
      return;
    }

    console.log('[DeepLink] No tokens or code found in URL');
  }

  // ── Auth methods ───────────────────────────────────────────
  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: fullName ? { full_name: fullName } : undefined,
        emailRedirectTo: REDIRECT_URL,
      },
    });

    if (error) return { error: error.message };

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName ?? null,
      });
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
