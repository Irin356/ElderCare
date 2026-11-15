import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { useAuth } from '../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [relationship, setRelationship] = useState(user.relationship || '');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(user.name);
    setPhone(user.phone || '');
    setRelationship(user.relationship || '');
  }, [user]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await updateProfile({ name, phone, relationship });
      setMessage('Profile updated.');
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : 'Profile update failed.');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (signOutError: unknown) {
      setError(signOutError instanceof Error ? signOutError.message : 'Sign out failed.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Your Profile</h1>
          <p className="text-slate-600">Account type: {user.role}</p>
        </div>
        {error && <p role="alert" className="text-rose-700 font-semibold">{error}</p>}
        {message && <p role="status" className="text-emerald-700 font-semibold">{message}</p>}
        <form onSubmit={save} className="space-y-4">
          <label className="block font-bold text-slate-700">
            Full name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="mt-1 w-full rounded-xl border-2 border-slate-300 p-3"
            />
          </label>
          <label className="block font-bold text-slate-700">
            Phone
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-slate-300 p-3"
            />
          </label>
          <label className="block font-bold text-slate-700">
            Relationship
            <input
              value={relationship}
              onChange={(event) => setRelationship(event.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-slate-300 p-3"
            />
          </label>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>
        <Button type="button" variant="secondary" onClick={() => void signOut()}>
          Sign Out
        </Button>
      </Card>
    </div>
  );
};

export const ResetPasswordPage: React.FC = () => {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await updatePassword(password);
      setMessage('Password updated. You can now sign in with the new password.');
      window.setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (updateError: unknown) {
      setError(updateError instanceof Error ? updateError.message : 'Password update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <Card className="space-y-5">
        <h1 className="text-3xl font-extrabold text-slate-900">Set a New Password</h1>
        {error && <p role="alert" className="text-rose-700">{error}</p>}
        {message && <p role="status" className="text-emerald-700">{message}</p>}
        <form onSubmit={submit} className="space-y-4">
          <label className="block font-bold text-slate-700">
            New password
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-slate-300 p-3"
            />
          </label>
          <Button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
