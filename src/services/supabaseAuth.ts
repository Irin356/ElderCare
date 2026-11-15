import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  relationship?: string;
}

const userRoles: readonly UserRole[] = ['elderly', 'caregiver', 'family', 'doctor'];

const isUserRole = (role: string): role is UserRole =>
  userRoles.some((allowedRole) => allowedRole === role);

const parseUserProfile = (row: {
  id: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
  phone: string | null;
  relationship: string | null;
  emergency_contact: boolean | null;
}): UserProfile => {
  if (!isUserRole(row.role)) {
    throw new Error('Your profile has an unsupported role. Contact an administrator.');
  }
  return {
    id: row.id,
    name: row.full_name,
    role: row.role,
    avatar: row.avatar_url || undefined,
    phone: row.phone || undefined,
    relationship: row.relationship || undefined,
    emergencyContact: row.emergency_contact || false,
  };
};

export const supabaseAuth = {
  isConfigured: isSupabaseConfigured,

  async registerUser({ email, password, fullName, role, phone, relationship }: SignUpData) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Running in Demo Mode.');
    }
    if (!userRoles.includes(role)) throw new Error('Select a supported account type.');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          phone,
          relationship,
        },
      },
    });

    if (error) throw error;
    return data;
  },

  async loginUser(email: string, password: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Running in Demo Mode.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async logoutUser() {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentSession() {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getUserProfile(userId: string): Promise<UserProfile> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, avatar_url, phone, relationship, emergency_contact')
      .eq('id', userId)
      .single();

    if (error) throw new Error(`Failed to load your profile: ${error.message}`);
    return parseUserProfile(data);
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const payload: {
      full_name?: string;
      phone?: string | null;
      relationship?: string | null;
      avatar_url?: string | null;
    } = {};
    if (updates.name !== undefined) payload.full_name = updates.name;
    if (updates.phone !== undefined) payload.phone = updates.phone || null;
    if (updates.relationship !== undefined) payload.relationship = updates.relationship || null;
    if (updates.avatar !== undefined) payload.avatar_url = updates.avatar || null;

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('id, full_name, role, avatar_url, phone, relationship, emergency_contact')
      .single();

    if (error) throw error;
    return parseUserProfile(data);
  },

  async requestPasswordReset(email: string, redirectTo: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Password recovery is available only when Supabase is configured.');
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  },

  async updatePassword(password: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Password updates are available only when Supabase is configured.');
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },
};
