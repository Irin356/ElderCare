import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';

const authMocks = vi.hoisted(() => ({
  getCurrentSession: vi.fn(),
  getUserProfile: vi.fn(),
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  logoutUser: vi.fn(),
  requestPasswordReset: vi.fn(),
  updatePassword: vi.fn(),
  updateProfile: vi.fn(),
  onAuthStateChange: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      onAuthStateChange: authMocks.onAuthStateChange,
    },
  },
}));

vi.mock('../services/supabaseAuth', () => ({
  supabaseAuth: {
    getCurrentSession: authMocks.getCurrentSession,
    getUserProfile: authMocks.getUserProfile,
    loginUser: authMocks.loginUser,
    registerUser: authMocks.registerUser,
    logoutUser: authMocks.logoutUser,
    requestPasswordReset: authMocks.requestPasswordReset,
    updatePassword: authMocks.updatePassword,
    updateProfile: authMocks.updateProfile,
  },
}));

const profile = {
  id: 'auth-user-1',
  name: 'Test Caregiver',
  role: 'caregiver' as const,
  phone: '5550100',
};

const AuthProbe: React.FC = () => {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="ready">{String(auth.authReady)}</span>
      <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="name">{auth.user.name}</span>
      <button onClick={() => void auth.updateProfile({ name: 'Updated Name' })}>
        Update profile
      </button>
      <button onClick={() => void auth.loginWithCredentials('person@example.test', 'password123')}>
        Sign in
      </button>
      <button
        onClick={() =>
          void auth.register({
            email: 'new@example.test',
            password: 'password123',
            fullName: 'New User',
            role: 'elderly',
          })
        }
      >
        Register
      </button>
      <button onClick={() => void auth.requestPasswordReset('person@example.test')}>Recover</button>
      <button onClick={() => void auth.updatePassword('newpassword123')}>Update password</button>
      <button onClick={() => void auth.logout()}>Sign out</button>
    </div>
  );
};

const renderProvider = () =>
  render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>
  );

describe('Supabase authentication context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.getCurrentSession.mockResolvedValue(null);
    authMocks.getUserProfile.mockResolvedValue(profile);
    authMocks.loginUser.mockResolvedValue({ user: { id: profile.id } });
    authMocks.registerUser.mockResolvedValue({
      user: { id: profile.id },
      session: { access_token: 'test-session' },
    });
    authMocks.logoutUser.mockResolvedValue(undefined);
    authMocks.requestPasswordReset.mockResolvedValue(undefined);
    authMocks.updatePassword.mockResolvedValue(undefined);
    authMocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: authMocks.unsubscribe } },
    });
  });

  it('restores a persisted session profile and waits for the profile before marking auth ready', async () => {
    authMocks.getCurrentSession.mockResolvedValue({ user: { id: profile.id } });
    renderProvider();

    await waitFor(() => expect(screen.getByTestId('ready')).toHaveTextContent('true'));
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('name')).toHaveTextContent(profile.name);
  });

  it('signs in and registers using the authenticated profile role, not a local role switch', async () => {
    const user = userEvent.setup();
    renderProvider();
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('true'));
    expect(authMocks.loginUser).toHaveBeenCalledWith('person@example.test', 'password123');

    await user.click(screen.getByRole('button', { name: 'Register' }));
    expect(authMocks.registerUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'new@example.test', role: 'elderly' })
    );
    expect(authMocks.getUserProfile).toHaveBeenCalledWith(profile.id);
  });

  it('supports password recovery, password update, profile updates, and logout', async () => {
    const user = userEvent.setup();
    authMocks.updateProfile.mockResolvedValue({ ...profile, name: 'Updated Name' });
    renderProvider();

    await user.click(screen.getByRole('button', { name: 'Recover' }));
    expect(authMocks.requestPasswordReset).toHaveBeenCalledWith(
      'person@example.test',
      `${window.location.origin}/reset-password`
    );
    await user.click(screen.getByRole('button', { name: 'Update password' }));
    expect(authMocks.updatePassword).toHaveBeenCalledWith('newpassword123');

    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('true'));
    await user.click(screen.getByRole('button', { name: 'Update profile' }));
    await waitFor(() => expect(screen.getByTestId('name')).toHaveTextContent('Updated Name'));
    expect(authMocks.updateProfile).toHaveBeenCalledWith(profile.id, { name: 'Updated Name' });
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('false'));
    expect(authMocks.unsubscribe).not.toHaveBeenCalled();
  });
});
