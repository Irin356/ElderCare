import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Users, User, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

type AuthMode = 'login' | 'register' | 'recover';

const routeForRole = (role: UserRole) =>
  role === 'elderly' ? '/elderly-dashboard' : '/caregiver-dashboard';

export const LoginPage: React.FC = () => {
  const {
    isDemoMode,
    login,
    loginWithCredentials,
    register,
    requestPasswordReset,
    authError,
  } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('caregiver');
  const [errorMessage, setErrorMessage] = useState<string | null>(authError);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const enterDemo = (role: 'elderly' | 'caregiver') => {
    login(role);
    navigate(routeForRole(role));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      if (mode === 'recover') {
        await requestPasswordReset(email);
        setSuccessMessage('If the account exists, a password recovery link has been sent.');
      } else if (mode === 'login') {
        const signedInProfile = await loginWithCredentials(email, password);
        navigate(routeForRole(signedInProfile.role));
      } else {
        const registeredProfile = await register({
          email,
          password,
          fullName,
          role: selectedRole,
          phone,
        });
        if (registeredProfile) {
          navigate(routeForRole(registeredProfile.role));
        } else {
          setSuccessMessage('Check your email to confirm the account, then sign in.');
        }
      }
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      <header className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-teal-600 text-white shadow-lg">
          <Heart className="w-9 h-9 fill-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          {mode === 'register'
            ? 'Create an ElderCare Account'
            : mode === 'recover'
            ? 'Recover Your Password'
            : 'Sign In to ElderCare'}
        </h1>
        <p className="text-lg text-slate-600 max-w-xl mx-auto">
          {isDemoMode
            ? 'Demo Mode uses sample data saved on this device. Do not enter real health information.'
            : 'Sign in to your care account. Supabase connectivity and database setup must be verified separately.'}
        </p>
        <Badge variant={isDemoMode ? 'warning' : 'success'} icon={<ShieldCheck className="w-4 h-4" />}>
          {isDemoMode ? 'Demo Mode — LocalStorage' : 'Supabase configured — connection not verified'}
        </Badge>
      </header>

      {isDemoMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card interactive onClick={() => enterDemo('elderly')} className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-7 h-7 text-teal-700" />
              <h2 className="text-xl font-bold">Senior Demo</h2>
            </div>
            <p className="text-slate-600">Open the local sample senior dashboard.</p>
            <Button fullWidth icon={<ArrowRight className="w-5 h-5" />} iconPosition="right">
              Enter Demo
            </Button>
          </Card>
          <Card interactive onClick={() => enterDemo('caregiver')} className="space-y-4">
            <div className="flex items-center gap-3">
              <Users className="w-7 h-7 text-sky-700" />
              <h2 className="text-xl font-bold">Caregiver Demo</h2>
            </div>
            <p className="text-slate-600">Open the local sample caregiver dashboard.</p>
            <Button variant="secondary" fullWidth icon={<ArrowRight className="w-5 h-5" />} iconPosition="right">
              Enter Demo
            </Button>
          </Card>
        </div>
      )}

      <Card className="max-w-xl mx-auto space-y-5">
        {mode !== 'recover' && (
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-3 font-bold border-b-4 ${
                mode === 'login' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-3 font-bold border-b-4 ${
                mode === 'register' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {mode === 'recover' && (
          <p className="text-sm text-slate-600">
            Enter your email address. If an account exists, Supabase will send a recovery link.
          </p>
        )}
        {errorMessage && (
          <div role="alert" className="bg-rose-50 border-2 border-rose-300 text-rose-900 p-4 rounded-2xl flex gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div role="status" className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 p-4 rounded-2xl flex gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <label className="block text-sm font-bold text-slate-700">
                Full Name
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  autoComplete="name"
                  className="mt-1 w-full px-4 py-3 rounded-2xl border-2 border-slate-300"
                />
              </label>
              <label className="block text-sm font-bold text-slate-700">
                Phone Number
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  autoComplete="tel"
                  className="mt-1 w-full px-4 py-3 rounded-2xl border-2 border-slate-300"
                />
              </label>
            </>
          )}

          <label className="block text-sm font-bold text-slate-700">
            Email Address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="mt-1 w-full px-4 py-3 rounded-2xl border-2 border-slate-300"
            />
          </label>

          {mode !== 'recover' && (
            <label className="block text-sm font-bold text-slate-700">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                className="mt-1 w-full px-4 py-3 rounded-2xl border-2 border-slate-300"
              />
            </label>
          )}

          {mode === 'register' && (
            <label className="block text-sm font-bold text-slate-700">
              Account type
              <select
                value={selectedRole}
                onChange={(event) => setSelectedRole(event.target.value as UserRole)}
                className="mt-1 w-full px-4 py-3 rounded-2xl border-2 border-slate-300"
              >
                <option value="elderly">Care recipient</option>
                <option value="caregiver">Caregiver</option>
                <option value="family">Family member</option>
                <option value="doctor">Doctor</option>
              </select>
            </label>
          )}

          <Button type="submit" fullWidth disabled={loading}>
            {loading
              ? 'Please wait...'
              : mode === 'recover'
              ? 'Send Recovery Link'
              : mode === 'register'
              ? 'Create Account'
              : 'Sign In'}
          </Button>
        </form>

        {mode === 'login' && !isDemoMode && (
          <button
            type="button"
            onClick={() => {
              setMode('recover');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className="text-sm font-bold text-teal-700 hover:text-teal-900"
          >
            Forgot password?
          </button>
        )}
        {mode === 'recover' && (
          <button
            type="button"
            onClick={() => setMode('login')}
            className="text-sm font-bold text-teal-700 hover:text-teal-900"
          >
            Back to sign in
          </button>
        )}
      </Card>
    </div>
  );
};
