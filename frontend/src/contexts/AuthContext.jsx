import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { trackEvent } from '../lib/analytics';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        
      if (error) {
        console.error("Error fetching profile:", error);
      } else {
         setProfile(data?.[0] || null);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    trackEvent('login', { method: 'password' });
    return data;
  };

  const register = async (name, business_name, phone, email, password, referralCode) => {
    // Register user via Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          business_name,
          phone,
          referral_code: referralCode,
        }
      }
    });
    
    if (error) throw error;
    trackEvent('signup_completed', { method: 'password' });
    
    // Insert into profiles if signup successful
    if (data?.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: data.user.id, 
            name, 
            business_name, 
            phone, 
            email, 
            referral_code: referralCode,
            ai_calls_this_month: 0 
          }
        ]);
        
      if (profileError) {
        console.error("Error creating profile:", profileError);
        // We do not throw here so the user is still signed in, but we log the error.
        // Usually, trigger should create the profile, but we'll do it manually to be safe or assuming no triggers.
      } else {
        await fetchProfile(data.user.id);
      }
    }
    
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
  };

  const checkAILimits = () => {
    if (!profile) return false;
    return profile.ai_calls_this_month < 10;
  };

  const incrementAICalls = async () => {
    if (!user || !profile) return;
    
    const newCount = (profile.ai_calls_this_month || 0) + 1;
    
    const { error } = await supabase
      .from('profiles')
      .update({ ai_calls_this_month: newCount })
      .eq('id', user.id);
      
    if (error) {
      console.error("Failed to increment AI calls:", error);
    } else {
      setProfile(prev => ({ ...prev, ai_calls_this_month: newCount }));
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      login, 
      register, 
      logout,
      checkAILimits,
      incrementAICalls
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
