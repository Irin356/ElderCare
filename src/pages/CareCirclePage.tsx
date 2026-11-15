import React, { useState } from 'react';
import { Users2, Phone, MessageSquare, Plus, UserCheck, Copy } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { useCare } from '../context/CareContext';
import { useAuth } from '../context/AuthContext';

export const CareCirclePage: React.FC = () => {
  const {
    careCircle,
    isDemoMode,
    activeElderId,
    createCareInvite,
    acceptCareInvite,
  } = useCare();
  const { role } = useAuth();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteRole, setInviteRole] = useState('family_member');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [canManageMeds, setCanManageMeds] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (isDemoMode) {
      setError('Demo Mode does not create real invitations.');
      return;
    }

    setLoading(true);
    try {
      const code = await createCareInvite(inviteRole, relationship, phone, canManageMeds);
      setInviteCode(code);
      setMessage('Invitation created. Share this one-time code with the invited person.');
      setRelationship('');
      setPhone('');
      setCanManageMeds(false);
    } catch (inviteError: unknown) {
      setError(inviteError instanceof Error ? inviteError.message : 'Invitation creation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      await acceptCareInvite(inviteCodeInput.trim());
      setInviteCodeInput('');
      setMessage('Invitation accepted. The shared care profile is now available.');
    } catch (inviteError: unknown) {
      setError(inviteError instanceof Error ? inviteError.message : 'Invitation acceptance failed.');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setMessage('Invitation code copied.');
    } catch {
      setError('Clipboard access failed. Select and copy the invitation code manually.');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-sm font-bold">
            <Users2 className="w-5 h-5 text-teal-600" />
            <span>Family & Care Team Network</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">CareCircle</h1>
          <p className="text-base text-slate-600">
            Only members authorized for the selected elder profile are shown.
          </p>
        </div>
        {!isDemoMode && role === 'elderly' && activeElderId && (
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-5 h-5" />}
            onClick={() => {
              setShowInviteForm((shown) => !shown);
              setInviteCode(null);
              setError(null);
              setMessage(null);
            }}
          >
            Invite Member
          </Button>
        )}
      </header>

      {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-emerald-900">{message}</p>}
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-900">{error}</p>}
      {isDemoMode && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900">
          Demo Mode — members and permissions below are sample data.
        </p>
      )}

      {showInviteForm && (
        <Card className="space-y-4">
          <h2 className="text-xl font-bold">Create Care Invitation</h2>
          <p className="text-sm text-slate-600">
            The database stores only a hash of the invitation code. Share the returned code over a trusted channel.
          </p>
          {!inviteCode ? (
            <form onSubmit={handleInvite} className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold text-slate-700">
                Access role
                <select
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value)}
                  className="mt-1 w-full rounded-xl border-2 border-slate-300 p-3"
                >
                  <option value="family_member">Family member</option>
                  <option value="primary_caregiver">Primary caregiver</option>
                  <option value="visiting_nurse">Visiting nurse</option>
                  <option value="doctor">Doctor</option>
                  <option value="emergency_contact">Emergency contact</option>
                </select>
              </label>
              <label className="text-sm font-bold text-slate-700">
                Relationship
                <input
                  required
                  value={relationship}
                  onChange={(event) => setRelationship(event.target.value)}
                  className="mt-1 w-full rounded-xl border-2 border-slate-300 p-3"
                  placeholder="Daughter, nurse, neighbor..."
                />
              </label>
              <label className="text-sm font-bold text-slate-700">
                Phone (optional; must match when accepting)
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="mt-1 w-full rounded-xl border-2 border-slate-300 p-3"
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={canManageMeds}
                  onChange={(event) => setCanManageMeds(event.target.checked)}
                />
                Allow medication management
              </label>
              <div className="flex gap-3 sm:col-span-2">
                <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Invitation'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowInviteForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <code className="block break-all rounded-xl bg-slate-100 p-4 text-lg">{inviteCode}</code>
              <Button type="button" variant="secondary" icon={<Copy className="w-4 h-4" />} onClick={() => void copyInviteCode()}>
                Copy Code
              </Button>
            </div>
          )}
        </Card>
      )}

      {!isDemoMode && (
        <Card className="space-y-4">
          <h2 className="text-xl font-bold">Accept an Invitation</h2>
          <form onSubmit={handleAcceptInvite} className="flex flex-col sm:flex-row gap-3">
            <input
              value={inviteCodeInput}
              onChange={(event) => setInviteCodeInput(event.target.value)}
              required
              minLength={32}
              autoComplete="one-time-code"
              placeholder="Paste invitation code"
              className="min-w-0 flex-1 rounded-xl border-2 border-slate-300 p-3"
            />
            <Button type="submit" disabled={loading}>{loading ? 'Checking...' : 'Accept Invitation'}</Button>
          </form>
        </Card>
      )}

      {careCircle.length === 0 && !isDemoMode && (
        <Card>
          <p className="text-slate-700">
            No shared care members are available for this account yet. An elder profile owner can invite you.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {careCircle.map((member) => (
          <Card key={member.id} className="space-y-5">
            <div className="flex items-center gap-4">
              {member.avatar ? (
                <img src={member.avatar} alt="" className="w-14 h-14 rounded-2xl object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  {member.name.charAt(0)}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">{member.name}</h3>
                  {member.isPrimaryContact && <Badge variant="teal" size="sm">Primary</Badge>}
                </div>
                <p className="text-sm font-bold text-slate-600">{member.role}</p>
                <p className="text-xs text-slate-500">{member.relation}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <UserCheck className="w-4 h-4 text-sky-600" />
              {member.canManageMeds ? 'Medication management permitted' : 'Medication management not permitted'}
            </div>
            {member.phone && (
              <div className="flex gap-3">
                <a href={`tel:${member.phone}`} className="flex-1 rounded-xl bg-teal-600 p-3 text-center font-bold text-white">
                  <Phone className="inline w-4 h-4 mr-2" />Call
                </a>
                <a href={`sms:${member.phone}`} className="rounded-xl bg-slate-100 p-3 font-bold text-slate-700">
                  <MessageSquare className="inline w-4 h-4 mr-2" />Message
                </a>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
