import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { hasSupabaseConfig, supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

const upsertProfile = async (user, fullName) => {
  if (!user?.id) return;

  const profilePayload = {
    id: user.id,
    full_name: fullName || user.user_metadata?.full_name || null,
    role: 'user',
  };

  const { error } = await supabase
    .from('profiles')
    .upsert(profilePayload, { onConflict: 'id' });

  if (error) {
    throw error;
  }
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState('');

  const fetchProfile = useCallback(async (authUser) => {
    if (!authUser?.id) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .eq('id', authUser.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    setProfile(data || null);
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setConfigError('Supabase is not configured. Create frontend/.env with REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY, then restart frontend.');
      setLoading(false);
      return () => {};
    }

    let isMounted = true;

    const initializeAuth = async () => {
      let data = null;
      let error = null;
      try {
        const result = await supabase.auth.getSession();
        data = result.data;
        error = result.error;
      } catch (sessionError) {
        error = sessionError;
      }

      if (error) {
        console.error('Error getting session:', error);
      }

      if (!isMounted) return;

      const currentSession = data?.session || null;

      if (currentSession?.user) {
        try {
          await fetchProfile(currentSession.user);
        } catch (profileError) {
          console.error('Error fetching profile:', profileError);
        }
      } else {
        setProfile(null);
      }

      setSession(currentSession);
      setUser(currentSession?.user || null);

      setLoading(false);
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;

      if (newSession?.user) {
        try {
          await fetchProfile(newSession.user);
        } catch (profileError) {
          console.error('Error fetching profile:', profileError);
        }
      } else {
        setProfile(null);
      }

      setSession(newSession || null);
      setUser(newSession?.user || null);

      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = useCallback(async ({ email, password, fullName }) => {
    if (!hasSupabaseConfig) {
      throw new Error('Supabase is not configured.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName || '' },
      },
    });

    if (error) {
      throw error;
    }

    if (data?.user) {
      await upsertProfile(data.user, fullName);
      await fetchProfile(data.user);
    }

    return data;
  }, [fetchProfile]);

  const signIn = useCallback(async ({ email, password }) => {
    if (!hasSupabaseConfig) {
      throw new Error('Supabase is not configured.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data?.user) {
      await fetchProfile(data.user);
    }

    return data;
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    // Explicitly clear state to avoid race condition
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      configError,
      hasSupabaseConfig,
      isAuthenticated: Boolean(user),
      signUp,
      signIn,
      signOut,
      refreshProfile: async () => {
        if (user) {
          await fetchProfile(user);
        }
      },
    }),
    [session, user, profile, loading, configError, signIn, signOut, signUp, fetchProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
