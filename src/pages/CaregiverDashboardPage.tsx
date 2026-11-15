import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Heart,
  Droplets,
  Moon,
  Pill,
  Users,
  Mic,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  Check,
  UserCheck,
  X,
  ShieldAlert,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { useCare } from '../context/CareContext';
import { useAuth } from '../context/AuthContext';
import { FollowUpResolutionType, FollowUpTask } from '../types';

export const CaregiverDashboardPage: React.FC = () => {
  const {
    medications,
    careLoop,
    voiceSessions,
    appointments,
    careCircle,
    followUpTasks,
    simulateUnconfirmedDose,
    acknowledgeFollowUpTask,
    escalateFollowUpTask,
    resolveFollowUpTask,
    resetDemoData,
    isDemoMode,
    elderlyName,
  } = useCare();

  const { user } = useAuth();
  const currentCaregiverName = user.name;
  const currentCaregiverRole = user.relationship || user.role;

  const [activeTaskForResolution, setActiveTaskForResolution] = useState<FollowUpTask | null>(null);
  const [resolutionType, setResolutionType] = useState<FollowUpResolutionType>('dose_taken');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const takenMedsCount = medications.filter((m) => m.status === 'taken').length;
  const totalMedsCount = medications.length;
  const adherenceRate = totalMedsCount
    ? Math.round((takenMedsCount / totalMedsCount) * 100)
    : 0;
  const completedLoopCount = careLoop.filter((c) => c.completed).length;
  const latestVoiceSession = voiceSessions[0];

  const activeFollowUps = followUpTasks.filter((t) => t.status !== 'resolved');
  const resolvedFollowUps = followUpTasks.filter((t) => t.status === 'resolved');

  const handleAcknowledge = (task: FollowUpTask) => {
    acknowledgeFollowUpTask(task.id, {
      id: user.role === 'caregiver' ? user.id : 'usr-caregiver-1',
      name: currentCaregiverName,
    });
    setFeedbackMessage(
      isDemoMode
        ? `Acknowledged: Medication status remains unconfirmed until verified.`
        : 'Acknowledgement request submitted. The dose will remain unconfirmed until a dose event is recorded.'
    );
    setTimeout(() => setFeedbackMessage(null), 6000);
  };

  const handleEscalate = (taskId: string) => {
    escalateFollowUpTask(taskId, true);
    setFeedbackMessage(
      isDemoMode
        ? 'Escalated to the sample backup caregiver.'
        : 'Escalation request submitted. The database selects the next authorized caregiver.'
    );
    setTimeout(() => setFeedbackMessage(null), 6000);
  };

  const handleOpenResolutionModal = (task: FollowUpTask) => {
    setActiveTaskForResolution(task);
    setResolutionType('dose_taken');
    setResolutionNotes('');
  };

  const handleConfirmResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTaskForResolution) return;

    const resolutionLabels: Record<FollowUpResolutionType, string> = {
      dose_taken: 'Dose confirmed taken by elderly person',
      dose_skipped: 'Dose skipped',
      help_required: 'Help required',
      medicine_unavailable: 'Medicine unavailable / Refill needed',
      unable_to_contact: 'Unable to contact elderly person',
      further_assistance_required: 'Further assistance required / Clinic alert',
    };

    resolveFollowUpTask(
      activeTaskForResolution.id,
      {
        type: resolutionType,
        label: resolutionLabels[resolutionType],
        notes: resolutionNotes,
      },
      {
        name: currentCaregiverName,
        role: currentCaregiverRole,
      }
    );

    setActiveTaskForResolution(null);
    setFeedbackMessage(
      isDemoMode
        ? `Resolution recorded: ${resolutionLabels[resolutionType]}.`
        : 'Resolution submitted. The saved task and dose events will refresh from the database.'
    );
    setTimeout(() => setFeedbackMessage(null), 6000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Demo Mode Notice */}
      {isDemoMode && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm text-amber-900">
          <div className="flex items-center gap-2 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span>CareLoop Demo Mode: Local storage persistence active (single device preview).</span>
          </div>
          <span className="text-amber-700 font-semibold">
            Supabase credentials not configured in .env
          </span>
        </div>
      )}

      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="bg-sky-900 text-white rounded-2xl p-4 shadow-lg flex items-center justify-between border-2 border-sky-600 animate-fadeIn">
          <div className="flex items-center gap-3 font-bold text-sm sm:text-base">
            <CheckCircle2 className="w-6 h-6 text-sky-300 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="p-1 hover:bg-sky-800 rounded-lg text-sky-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-700 text-sm font-bold">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>Caregiver Oversight Portal{elderlyName ? ` • Patient: ${elderlyName}` : ''}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Family Caregiver Dashboard
          </h1>
        </div>

        {/* Action & Demonstration Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {isDemoMode && <button
            onClick={() => simulateUnconfirmedDose()}
            title="Demonstration Tool: Simulate an unconfirmed dose beyond grace period"
            className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold text-xs sm:text-sm border border-amber-300 flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
          >
            <Play className="w-4 h-4 text-amber-700 fill-amber-700" />
            <span>Simulate Unconfirmed Dose</span>
          </button>}

          {isDemoMode && <button
            onClick={resetDemoData}
            title="Reset demo data to initial state"
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>}

          <Link to="/timeline">
            <Button variant="outline" size="sm" icon={<Clock className="w-4 h-4" />}>
              Timeline
            </Button>
          </Link>
        </div>
      </div>

      {/* CRITICAL CARELOOP SECTION: ACTIVE MEDICATION FOLLOW-UP TASKS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <AlertTriangle className="w-7 h-7 text-rose-600" />
              <span>Medication Follow-Up Tasks (CareLoop)</span>
            </h2>
            {activeFollowUps.length > 0 ? (
              <Badge variant="danger" size="md">
                {activeFollowUps.length} Urgent Action Required
              </Badge>
            ) : (
              <Badge variant="success" size="md">
                All Cleared
              </Badge>
            )}
          </div>
        </div>

        {activeFollowUps.length > 0 ? (
          <div className="space-y-4">
            {activeFollowUps.map((task) => {
              const isAcknowledged = task.status === 'acknowledged';
              const isEscalated = task.status === 'escalated';

              return (
                <div
                  key={task.id}
                  className={`rounded-3xl border-3 p-6 sm:p-7 shadow-elevated transition-all space-y-4 ${
                    isEscalated
                      ? 'bg-purple-50/70 border-purple-400'
                      : isAcknowledged
                      ? 'bg-sky-50/60 border-sky-400'
                      : 'bg-rose-50/60 border-rose-400'
                  }`}
                >
                  {/* Task Top Meta */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={isEscalated ? 'purple' : isAcknowledged ? 'info' : 'danger'}
                        size="md"
                      >
                        Status: {task.status.toUpperCase()}
                      </Badge>

                      <span className="text-xs font-bold text-slate-600">
                        Patient: <strong>{task.elderlyName}</strong>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-semibold text-slate-500">
                        Scheduled: <strong>{task.scheduledTime}</strong>
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-500">
                      Detected at {task.createdAt}
                    </div>
                  </div>

                  {/* Task Body */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1.5 flex-1">
                      <h3 className="text-2xl font-black text-slate-900">
                        {task.medicationName} ({task.dosage})
                      </h3>
                      <p className="text-base text-rose-900 font-bold flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                        <span>Reason: {task.followUpReason}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 pt-1">
                        <span className="bg-white/80 px-3 py-1.5 rounded-xl border border-slate-200 font-semibold">
                          Assigned Caregiver: <strong>{task.assignedCaregiverName}</strong>
                        </span>
                        {task.acknowledgedBy && (
                          <span className="bg-sky-100 text-sky-900 px-3 py-1.5 rounded-xl border border-sky-300 font-bold">
                            Acknowledged by {task.acknowledgedBy} at {task.acknowledgedAt}
                          </span>
                        )}
                        {task.escalatedToCaregiverName && (
                          <span className="bg-purple-100 text-purple-900 px-3 py-1.5 rounded-xl border border-purple-300 font-bold">
                            Escalated to {task.escalatedToCaregiverName} at {task.escalatedAt}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions: "I'll check on them", Resolution, Escalation */}
                    <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 min-w-[220px]">
                      {/* 1. "I'll check on them" */}
                      {!isAcknowledged && (
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => handleAcknowledge(task)}
                          className="w-full text-base cursor-pointer shadow-md"
                          icon={<UserCheck className="w-5 h-5" />}
                        >
                          I'll check on them
                        </Button>
                      )}

                      {/* 2. Record Resolution */}
                      <Button
                        variant="emerald"
                        size="md"
                        onClick={() => handleOpenResolutionModal(task)}
                        className="w-full text-base cursor-pointer shadow-md"
                        icon={<Check className="w-5 h-5 stroke-[3]" />}
                      >
                        Record Resolution
                      </Button>

                      {/* 3. Simulate Escalation Control */}
                      {!isEscalated && (
                        <button
                          onClick={() => handleEscalate(task.id)}
                          className="px-3 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs flex items-center justify-center gap-1.5 border border-purple-300 transition-colors cursor-pointer"
                        >
                          <ShieldAlert className="w-4 h-4 text-purple-700" />
                          <span>Simulate Escalation</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-8 bg-emerald-50/70 border-2 border-emerald-300 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>
            <h3 className="text-xl font-black text-emerald-900">
              No Unconfirmed Medication Doses
            </h3>
            <p className="text-sm text-emerald-800 max-w-md mx-auto">
              Eleanor has confirmed scheduled medications or no doses have exceeded the 45-minute grace period.
            </p>
            <div className="pt-2">
              <button
                onClick={() => simulateUnconfirmedDose()}
                className="px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border-2 border-emerald-400 font-extrabold text-sm rounded-2xl shadow-sm cursor-pointer"
              >
                + Test CareLoop: Simulate Unconfirmed Dose
              </button>
            </div>
          </Card>
        )}

        {resolvedFollowUps.length > 0 && (
          <div className="bg-slate-100/90 rounded-2xl p-4 border border-slate-200 space-y-2">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Recently Resolved Follow-Up Audits ({resolvedFollowUps.length}):
            </span>
            <div className="space-y-1.5">
              {resolvedFollowUps.map((t) => (
                <div
                  key={t.id}
                  className="text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-white p-2.5 rounded-xl border border-slate-200"
                >
                  <span>
                    ✓ <strong>{t.medicationName}</strong>: {t.resolution?.label} ({t.resolvedAt})
                  </span>
                  <span className="text-slate-500 font-semibold">
                    Verified by {t.resolvedBy}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Real-Time Vitals Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card highlight="teal" className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-teal-700 tracking-wider">
              Blood Pressure
            </span>
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">122 / 78</span>
            <span className="text-xs text-slate-500 font-semibold">mmHg</span>
          </div>
          <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Optimal (Logged 08:25 AM)
          </p>
        </Card>

        <Card highlight="sky" className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-sky-700 tracking-wider">
              Resting Pulse
            </span>
            <Activity className="w-5 h-5 text-sky-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">71</span>
            <span className="text-xs text-slate-500 font-semibold">BPM</span>
          </div>
          <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Stable normal rhythm
          </p>
        </Card>

        <Card highlight="amber" className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-700 tracking-wider">
              Medication Adherence
            </span>
            <Pill className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{adherenceRate}%</span>
            <span className="text-xs text-slate-500 font-semibold">
              ({takenMedsCount}/{totalMedsCount} taken)
            </span>
          </div>
          <p className="text-xs font-bold text-amber-700 flex items-center gap-1">
            {activeFollowUps.length > 0 ? '⚠️ Unconfirmed dose pending' : 'Schedule on track'}
          </p>
        </Card>

        <Card className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-purple-700 tracking-wider">
              Sleep & Hydration
            </span>
            <Moon className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">7.5 hrs</span>
            <span className="text-xs text-slate-500 font-semibold">Restful</span>
          </div>
          <p className="text-xs font-bold text-teal-700 flex items-center gap-1">
            <Droplets className="w-3.5 h-3.5" /> 500ml water logged
          </p>
        </Card>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: AI Voice Sentiment & Today's CareLoop Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Voice Sentiment Analysis Summary */}
          <Card highlight="teal" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Mic className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Latest VoiceCare AI Analysis
                  </h3>
                  <p className="text-xs text-slate-500">
                    Conducted {latestVoiceSession.time} • Duration: 3m 15s
                  </p>
                </div>
              </div>
              <Badge variant="success" size="md">
                Mood: {latestVoiceSession.moodDetected.toUpperCase()}
              </Badge>
            </div>

            <div className="bg-white/80 rounded-2xl p-4 border border-teal-200 space-y-2">
              <p className="text-base text-slate-800 leading-relaxed font-medium">
                "{latestVoiceSession.summary}"
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {latestVoiceSession.topicsDiscussed.map((topic, i) => (
                  <span
                    key={i}
                    className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg"
                  >
                    #{topic}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 font-medium">
                Using voice model: <strong>Sarah's Gentle Voice (Cloned)</strong>
              </span>
              <Link
                to="/voice-studio"
                className="text-teal-700 font-bold hover:text-teal-800 flex items-center gap-1"
              >
                <span>Voice Studio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Card>

          {/* CareLoop Daily Adherence */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">CareLoop Daily Adherence</h3>
                <p className="text-sm text-slate-500">
                  {completedLoopCount} of {careLoop.length} routine milestones completed today
                </p>
              </div>
              <Link to="/care-loop" className="text-sm font-bold text-teal-700 hover:text-teal-800">
                Manage Tasks →
              </Link>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-teal-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${(completedLoopCount / careLoop.length) * 100}%` }}
              />
            </div>

            <div className="space-y-2 pt-2">
              {careLoop.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        item.completed ? 'bg-emerald-500' : 'bg-amber-400'
                      }`}
                    />
                    <span
                      className={`text-sm font-bold ${
                        item.completed ? 'text-slate-600' : 'text-slate-900'
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">
                    {item.completed ? `Done at ${item.completedAt}` : `Due ${item.dueTime}`}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Col: CareCircle On-Duty & Upcoming Doctor Visit */}
        <div className="space-y-6">
          {/* CareCircle Mini Roster */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-600" />
                <h3 className="text-lg font-black text-slate-900">CareCircle Team</h3>
              </div>
              <Link to="/care-circle" className="text-xs font-bold text-sky-700 hover:text-sky-800">
                All Members
              </Link>
            </div>

            <div className="space-y-3">
              {careCircle.slice(0, 3).map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-slate-200"
                      />
                      {member.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{member.name}</div>
                      <div className="text-xs text-slate-500">{member.role}</div>
                    </div>
                  </div>
                  <a
                    href={`tel:${member.phone}`}
                    className="p-2 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded-xl"
                  >
                    📞
                  </a>
                </div>
              ))}
            </div>
          </Card>

          {/* Doctor Appointment Card */}
          <Card highlight="sky" className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-700">
                Next Appointment
              </span>
              <Calendar className="w-5 h-5 text-sky-600" />
            </div>

            <h4 className="text-base font-black text-slate-900">{appointments[0].doctorName}</h4>
            <p className="text-xs font-bold text-slate-500">{appointments[0].specialty}</p>
            <p className="text-xs text-slate-600">
              📅 {appointments[0].date} at {appointments[0].time}
            </p>

            <div className="pt-2">
              <Link to="/appointments">
                <Button variant="outline" size="sm" fullWidth>
                  View Details & Rides
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Follow-Up Resolution Modal */}
      {activeTaskForResolution && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border-4 border-emerald-500 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <Check className="w-7 h-7 text-emerald-600 stroke-[3]" />
                <span>Resolve Follow-Up</span>
              </h3>
              <button
                onClick={() => setActiveTaskForResolution(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm">
              <div className="font-extrabold text-slate-900">
                {activeTaskForResolution.medicationName} ({activeTaskForResolution.dosage})
              </div>
              <div className="text-slate-600">
                Patient: {activeTaskForResolution.elderlyName} • Scheduled: {activeTaskForResolution.scheduledTime}
              </div>
            </div>

            <form onSubmit={handleConfirmResolution} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Select Actual Outcome:
                </label>
                <div className="space-y-2">
                  {[
                    {
                      type: 'dose_taken',
                      label: 'Dose confirmed taken by elderly person',
                      desc: 'Updates medication status to Taken',
                    },
                    {
                      type: 'dose_skipped',
                      label: 'Dose skipped',
                      desc: 'Elderly person agreed to skip with cause',
                    },
                    {
                      type: 'help_required',
                      label: 'Help required',
                      desc: 'Physical assistance or swallowing aid required',
                    },
                    {
                      type: 'medicine_unavailable',
                      label: 'Medicine unavailable',
                      desc: 'Refill needed or pill misplaced',
                    },
                    {
                      type: 'unable_to_contact',
                      label: 'Unable to contact',
                      desc: 'Phone unanswered; neighbor notified',
                    },
                    {
                      type: 'further_assistance_required',
                      label: 'Further assistance required',
                      desc: 'Escalate to primary care physician / visiting nurse',
                    },
                  ].map((option) => (
                    <label
                      key={option.type}
                      className={`flex items-start gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                        resolutionType === option.type
                          ? 'border-emerald-500 bg-emerald-50 text-slate-900 font-bold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="resolutionType"
                        value={option.type}
                        checked={resolutionType === option.type}
                        onChange={() => setResolutionType(option.type as FollowUpResolutionType)}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 mt-0.5"
                      />
                      <div>
                        <div className="text-sm font-extrabold">{option.label}</div>
                        <div className="text-xs text-slate-500">{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Caregiver Clinical Notes:
                </label>
                <textarea
                  rows={2}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Eleanor took dose with glass of apple juice. Vitals were checked and stable."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="emerald" size="md" fullWidth type="submit" className="cursor-pointer">
                  Save Resolution to Timeline
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  type="button"
                  onClick={() => setActiveTaskForResolution(null)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
