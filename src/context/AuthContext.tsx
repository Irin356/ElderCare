import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { supabaseAuth, SignUpData } from '../services/supabaseAuth';

interface AuthContextType {
  user: UserProfile;
  role: UserRole;
  isAuthenticated: boolean;
  authReady: boolean;
  authError: string | null;
  isSupabaseAuth: boolean;
  isDemoMode: boolean;
  login: (role: UserRole, name?: string) => void;
  loginWithCredentials: (email: string, pass: string) => Promise<UserProfile>;
  register: (data: SignUpData) => Promise<UserProfile | null>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const DEFAULT_SENIOR: UserProfile = {
  id: 'usr-senior-1',
  name: 'Eleanor Vance',
  role: 'elderly',
  avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
  relationship: 'Care Recipient (Age 78)',
  phone: '+1 (555) 234-5678',
};

const DEFAULT_CAREGIVER: UserProfile = {
  id: 'usr-caregiver-1',
  name: 'Sarah Vance',
  role: 'caregiver',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
  relationship: 'Daughter & Primary Caregiver',
  phone: '+1 (555) 876-5432',
  emergencyContact: true,
};

const EMPTY_PROFILE: UserProfile = { id: '', name: '', role: 'elderly' };
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(
    isSupabaseConfigured ? null : DEFAULT_SENIOR
  );
  const [demoRole, setDemoRole] = useState<UserRole>('elderly');
  const [isAuthenticated, setIsAuthenticated] = useState(!isSupabaseConfigured);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let active = true;
    let latestRequest = 0;
    const loadSession = async (
      session: Awaited<ReturnType<typeof supabaseAuth.getCurrentSession>>
    ) => {
      const request = ++latestRequest;
      if (!session?.user) {
        if (active && request === latestRequest) {
          setProfile(null);
          setIsAuthenticated(false);
          setAuthReady(true);
          setAuthError(null);
        }
        return;
      }

      setAuthReady(false);
      try {
        const currentProfile = await supabaseAuth.getUserProfile(session.user.id);
        if (!active || request !== latestRequest) return;
        setProfile(currentProfile);
        setDemoRole(currentProfile.role);
        setIsAuthenticated(true);
        setAuthError(null);
      } catch (error) {
        if (!active || request !== latestRequest) return;
        setProfile(null);
        setIsAuthenticated(false);
        setAuthError(error instanceof Error ? error.message : 'Unable to load your profile.');
      } finally {
        if (active && request === latestRequest) setAuthReady(true);
      }
    };

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      void Promise.resolve().then(() => loadSession(session));
    });

    void supabaseAuth
      .getCurrentSession()
      .then((session) => loadSession(session))
      .catch((error: unknown) => {
        if (!active) return;
        setAuthError(error instanceof Error ? error.message : 'Unable to restore your session.');
        setIsAuthenticated(false);
        setAuthReady(true);
      });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const login = (newRole: UserRole, name?: string) => {
    if (isSupabaseConfigured) {
      throw new Error('Use email sign-in for a Supabase account. Demo personas are disabled.');
    }
    setDemoRole(newRole);
    setProfile({
      ...(newRole === 'elderly' ? DEFAULT_SENIOR : DEFAULT_CAREGIVER),
      name: name || (newRole === 'elderly' ? DEFAULT_SENIOR.name : DEFAULT_CAREGIVER.name),
      role: newRole,
    });
    setIsAuthenticated(true);
  };

  const loginWithCredentials = async (email: string, pass: string) => {
    if (!isSupabaseConfigured) {
      const newRole =
        email.toLowerCase().includes('caregiver') || email.toLowerCase().includes('sarah')
          ? 'caregiver'
          : 'elderly';
      login(newRole);
      return newRole === 'elderly' ? DEFAULT_SENIOR : DEFAULT_CAREGIVER;
    }

    const result = await supabaseAuth.loginUser(email, pass);
    if (!result.user) throw new Error('Authentication did not return a user.');
    const currentProfile = await supabaseAuth.getUserProfile(result.user.id);
    setProfile(currentProfile);
    setDemoRole(currentProfile.role);
    setIsAuthenticated(true);
    setAuthError(null);
    return currentProfile;
  };

  const register = async (data: SignUpData) => {
    if (!isSupabaseConfigured) {
      const demoProfile: UserProfile = {
        id: `demo-${Date.now()}`,
        name: data.fullName,
        role: data.role,
        phone: data.phone,
        relationship: data.relationship || data.role,
      };
      setProfile(demoProfile);
      setDemoRole(data.role);
      setIsAuthenticated(true);
      return demoProfile;
    }

    const result = await supabaseAuth.registerUser(data);
    if (!result.user || !result.session) return null;

    const currentProfile = await supabaseAuth.getUserProfile(result.user.id);
    setProfile(currentProfile);
    setDemoRole(currentProfile.role);
    setIsAuthenticated(true);
    setAuthError(null);
    return currentProfile;
  };

  const requestPasswordReset = (email: string) =>
    supabaseAuth.requestPasswordReset(email, `${window.location.origin}/reset-password`);

  const updatePassword = async (password: string) => {
    await supabaseAuth.updatePassword(password);
  };

  const logout = async () => {
    if (isSupabaseConfigured) await supabaseAuth.logoutUser();
    setProfile(null);
    setIsAuthenticated(false);
    setAuthError(null);
  };

  const switchRole = (newRole: UserRole) => {
    if (!isSupabaseConfigured) login(newRole);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (isSupabaseConfigured) {
      if (!profile?.id) throw new Error('Sign in before updating your profile.');
      const updatedProfile = await supabaseAuth.updateProfile(profile.id, updates);
      setProfile(updatedProfile);
      return;
    }
    setProfile((current) => ({ ...(current || EMPTY_PROFILE), ...updates }));
  };

  const user = profile || EMPTY_PROFILE;
  const role = isSupabaseConfigured ? user.role : profile?.role || demoRole;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        authReady,
        authError,
        isSupabaseAuth: isSupabaseConfigured,
        isDemoMode: !isSupabaseConfigured,
        login,
        loginWithCredentials,
        register,
        requestPasswordReset,
        updatePassword,
        logout,
        switchRole,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
