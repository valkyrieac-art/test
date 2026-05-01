import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Profile } from '../types';
import { AuthContext, type AuthContextValue } from './auth';
import { getDemoAccount, resolveLoginEmail } from '../config/accounts';

const DEMO_SESSION_KEY = 'yfp-demo-session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const setDemoAuth = useCallback((loginId: string, email: string, fullName: string, role: 'admin' | 'user') => {
    const user = { id: `demo-${loginId}`, email } as User;
    const demoSession = {
      access_token: 'demo-access-token',
      refresh_token: 'demo-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user,
    } as Session;
    const demoProfile: Profile = {
      id: user.id,
      email,
      full_name: fullName,
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({ loginId, email, fullName, role }));
    setSession(demoSession);
    setProfile(demoProfile);
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    setProfile(data as Profile);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      setProfile(null);
      return;
    }
    await fetchProfile(currentUser.id);
  }, [fetchProfile]);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      const rawDemoSession = localStorage.getItem(DEMO_SESSION_KEY);
      if (rawDemoSession) {
        const demo = JSON.parse(rawDemoSession) as {
          loginId: string;
          email: string;
          fullName: string;
          role: 'admin' | 'user';
        };
        setDemoAuth(demo.loginId, demo.email, demo.fullName, demo.role);
      }
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        try {
          await fetchProfile(data.session.user.id);
        } catch {
          setProfile(null);
        }
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        fetchProfile(nextSession.user.id).catch(() => setProfile(null));
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, setDemoAuth]);

  const signIn = useCallback(
    async (loginId: string, password: string) => {
      if (!isSupabaseConfigured) {
        const account = getDemoAccount(loginId, password);
        if (!account) throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
        setDemoAuth(account.loginId, account.email, account.label, account.role);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: resolveLoginEmail(loginId),
        password,
      });
      if (error) throw error;
    },
    [setDemoAuth],
  );

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) {
      localStorage.removeItem(DEMO_SESSION_KEY);
      setSession(null);
      setProfile(null);
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      isAdmin: profile?.role === 'admin',
      signIn,
      signOut,
      refreshProfile,
    }),
    [loading, profile, refreshProfile, session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
