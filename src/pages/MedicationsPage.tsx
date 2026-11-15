import React, { useState } from 'react';
import {
  Pill,
  Check,
  Clock,
  ShieldCheck,
  Info,
  Volume2,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useCare } from '../context/CareContext';
import { Medication } from '../types';

export const MedicationsPage: React.FC = () => {
  const { medications, markMedicationTaken } = useCare();
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'taken' | 'unconfirmed'>('all');
  const [audioFeedback, setAudioFeedback] = useState<string | null>(null);

  const filteredMeds = medications.filter((m) => {
    if (filter === 'scheduled') return m.status === 'scheduled' || m.status === 'snoozed';
    if (filter === 'taken') return m.status === 'taken';
    if (filter === 'unconfirmed') return m.status === 'unconfirmed';
    return true;
  });

  const handleSpeakInstruction = (med: Medication) => {
    setAudioFeedback(`Reading aloud: ${med.name}, ${med.dosage}. ${med.instructions}`);
    setTimeout(() => {
      setAudioFeedback(null);
    }, 4500);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-sm font-bold">
            <Pill className="w-5 h-5 text-teal-600" />
            <span>Prescription & Supplement Tracker</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Daily Medications
          </h1>
          <p className="text-base text-slate-600">
            Clear visual pill colors and easy one-tap confirmations.
          </p>
        </div>

        {/* Adherence Summary Pill */}
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-2xl border-2 border-slate-200 px-4 py-2.5 shadow-sm text-right">
            <div className="text-xs font-bold uppercase text-slate-500">
              Today's Adherence
            </div>
            <div className="text-lg font-black text-teal-700">
              {medications.filter((m) => m.status === 'taken').length} of {medications.length} Taken
            </div>
          </div>
        </div>
      </div>

      {/* Audio Announcement Toast / Feedback */}
      {audioFeedback && (
        <div className="bg-teal-700 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <Volume2 className="w-6 h-6 animate-pulse" />
            <span className="font-bold text-base">{audioFeedback}</span>
          </div>
          <button
            onClick={() => setAudioFeedback(null)}
            className="text-xs underline font-semibold text-teal-200 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b-2 border-slate-200 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-5 py-2.5 rounded-2xl font-extrabold text-sm sm:text-base transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All ({medications.length})
        </button>
        <button
          onClick={() => setFilter('scheduled')}
          className={`px-5 py-2.5 rounded-2xl font-extrabold text-sm sm:text-base transition-all cursor-pointer ${
            filter === 'scheduled'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Scheduled ({medications.filter((m) => m.status === 'scheduled').length})
        </button>
        <button
          onClick={() => setFilter('taken')}
          className={`px-5 py-2.5 rounded-2xl font-extrabold text-sm sm:text-base transition-all cursor-pointer ${
            filter === 'taken'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Taken ({medications.filter((m) => m.status === 'taken').length})
        </button>
        <button
          onClick={() => setFilter('unconfirmed')}
          className={`px-5 py-2.5 rounded-2xl font-extrabold text-sm sm:text-base transition-all cursor-pointer ${
            filter === 'unconfirmed'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Unconfirmed ({medications.filter((m) => m.status === 'unconfirmed').length})
        </button>
      </div>

      {/* Medication Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredMeds.map((med) => {
          const isTaken = med.status === 'taken';

          return (
            <div
              key={med.id}
              className={`rounded-3xl border-3 p-6 sm:p-7 shadow-soft transition-all ${
                isTaken
                  ? 'bg-emerald-50/40 border-emerald-300'
                  : 'bg-white border-amber-300 shadow-md'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  {/* Visual Pill Avatar */}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-sm"
                    style={{ backgroundColor: med.pillColor }}
                    aria-label={`Pill with color ${med.pillColor}`}
                  >
                    {med.shape === 'capsule' ? '💊' : '⚪'}
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight">
                      {med.name}
                    </h3>
                    <p className="text-base font-bold text-slate-700">{med.dosage}</p>
                  </div>
                </div>

                <Badge
                  variant={
                    isTaken
                      ? 'success'
                      : med.status === 'unconfirmed'
                      ? 'danger'
                      : med.status === 'snoozed'
                      ? 'purple'
                      : med.status === 'skipped'
                      ? 'warning'
                      : 'warning'
                  }
                  size="md"
                  icon={isTaken ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                >
                  {isTaken
                    ? 'Taken'
                    : med.status === 'unconfirmed'
                    ? 'Unconfirmed'
                    : med.status === 'snoozed'
                    ? `Snoozed (${med.snoozedUntil})`
                    : med.status === 'skipped'
                    ? 'Skipped'
                    : med.scheduleTime}
                </Badge>
              </div>

              {/* Instructions and prescribed by */}
              <div className="space-y-2 bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-6">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <p className="text-base text-slate-800 font-medium">
                    {med.instructions}
                  </p>
                </div>
                <div className="text-xs text-slate-500 font-semibold pl-7">
                  Prescribed by: {med.prescribedBy}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {isTaken ? (
                  <div className="flex-1 bg-emerald-100 text-emerald-900 rounded-2xl py-3 px-4 font-extrabold text-base flex items-center justify-center gap-2 border border-emerald-300">
                    <Check className="w-6 h-6 stroke-[3] text-emerald-700" />
                    <span>Confirmed {med.takenAt}</span>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => markMedicationTaken(med.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 border-emerald-500 text-lg shadow-lg"
                    icon={<Check className="w-6 h-6 stroke-[3]" />}
                  >
                    Mark as Taken
                  </Button>
                )}

                <button
                  onClick={() => handleSpeakInstruction(med)}
                  title="Read instructions aloud"
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 border border-slate-300 text-sm cursor-pointer"
                >
                  <Volume2 className="w-5 h-5 text-teal-600" />
                  <span>Listen</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Notice */}
      <div className="bg-teal-50 border-2 border-teal-200 rounded-3xl p-6 flex items-start gap-4">
        <ShieldCheck className="w-8 h-8 text-teal-600 shrink-0 mt-1" />
        <div className="space-y-1">
          <h4 className="text-lg font-bold text-teal-900">
            Pharmacy & Caregiver Synchronization
          </h4>
          <p className="text-sm text-teal-800 leading-relaxed">
            Whenever a dose is confirmed or missed for more than 45 minutes, an automated notification is sent to primary caregiver Sarah Vance. Refill request reminders are scheduled with CVS Pharmacy.
          </p>
        </div>
      </div>
    </div>
  );
};
