import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sun,
  Pill,
  Check,
  PhoneCall,
  Mic,
  Calendar,
  Sparkles,
  Heart,
  ArrowRight,
  Clock,
  RotateCcw,
  HelpCircle,
  AlertTriangle,
  X,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useCare } from '../context/CareContext';

export const ElderlyDashboardPage: React.FC = () => {
  const {
    medications,
    recordDoseTaken,
    recordDoseSkipped,
    recordDoseSnoozed,
    recordDoseNeedHelp,
    simulateUnconfirmedDose,
    followUpTasks,
    careLoop,
    toggleCareLoopItem,
    setActiveVoiceAssistant,
    isDemoMode,
  } = useCare();

  // Find medication needing attention (scheduled, snoozed, or unconfirmed)
  const currentMedication =
    medications.find((m) => m.status === 'unconfirmed') ||
    medications.find((m) => m.status === 'scheduled') ||
    medications.find((m) => m.status === 'snoozed');

  // Active follow-up task for this medication
  const activeTask = currentMedication
    ? followUpTasks.find((t) => t.medicationId === currentMedication.id && t.status !== 'resolved')
    : null;

  // Dialog states for Skip, Snooze, and Need Help
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipReason, setSkipReason] = useState('Feeling mild nausea this morning');
  const [showSnoozeModal, setShowSnoozeModal] = useState(false);
  const [snoozeMinutes, setSnoozeMinutes] = useState(15);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpNote, setHelpNote] = useState('I dropped a pill on the rug and need assistance');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const actor = { name: 'Eleanor Vance', role: 'Care Recipient' };

  const handleTakeDose = () => {
    if (!currentMedication) return;
    recordDoseTaken(currentMedication.id, actor);
    setActionFeedback(`Great job, Eleanor! ${currentMedication.name} marked as taken.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleConfirmSkip = () => {
    if (!currentMedication) return;
    recordDoseSkipped(currentMedication.id, skipReason, actor);
    setShowSkipModal(false);
    setActionFeedback(`${currentMedication.name} skipped. Sarah has been noted.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleConfirmSnooze = (minutes: number) => {
    if (!currentMedication) return;
    recordDoseSnoozed(currentMedication.id, minutes, actor);
    setShowSnoozeModal(false);
    setActionFeedback(`Reminder snoozed for ${minutes} minutes.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleConfirmNeedHelp = () => {
    if (!currentMedication) return;
    recordDoseNeedHelp(currentMedication.id, helpNote, actor);
    setShowHelpModal(false);
    setActionFeedback(`Help requested! Sarah Vance and care team alerted.`);
    setTimeout(() => setActionFeedback(null), 5000);
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

      {/* Action Toast Feedback Banner */}
      {actionFeedback && (
        <div className="bg-teal-700 text-white rounded-2xl px-6 py-4 shadow-lg flex items-center justify-between animate-fadeIn border-2 border-teal-500">
          <div className="flex items-center gap-3 font-extrabold text-base sm:text-lg">
            <CheckCircle2 className="w-7 h-7 text-teal-200" />
            <span>{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="p-1 hover:bg-teal-800 rounded-lg text-teal-200 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Warm, Large Senior Greeting Banner */}
      <section className="bg-gradient-to-r from-teal-600 to-teal-800 rounded-3xl p-6 sm:p-10 text-white shadow-elevated flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-teal-200 text-sm sm:text-base font-bold">
            <Sun className="w-6 h-6 text-amber-300" />
            <span>Sunday Morning, Nov 15 • 72°F & Mild Sunny</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Good morning, Eleanor!
          </h1>
          <p className="text-lg sm:text-xl text-teal-100 font-medium">
            You are doing wonderfully today. Your morning blood pressure was in the healthy zone.
          </p>
        </div>

        {/* Quick Voice Assistant Launcher */}
        <Link to="/voice-care" onClick={() => setActiveVoiceAssistant(true)}>
          <button className="bg-white text-teal-900 hover:bg-teal-50 active:scale-95 transition-all p-5 sm:p-6 rounded-3xl shadow-xl flex items-center gap-4 text-left border-4 border-teal-300/60 cursor-pointer">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
              <Mic className="w-8 h-8 text-teal-700 animate-pulse" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black leading-tight">
                Talk with Maya
              </div>
              <div className="text-sm font-semibold text-slate-600">
                Tap to speak or listen
              </div>
            </div>
          </button>
        </Link>
      </section>

      {/* Prominent Next Medication & Follow-Up Card */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
              <Pill className="w-8 h-8 text-teal-600" />
              <span>Medication Reminder</span>
            </h2>
            {currentMedication?.status === 'unconfirmed' && (
              <Badge variant="danger" size="md">
                Unconfirmed
              </Badge>
            )}
            {currentMedication?.status === 'snoozed' && (
              <Badge variant="purple" size="md">
                Snoozed until {currentMedication.snoozedUntil}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Developer Demonstration Control */}
            {currentMedication && (
              <button
                onClick={() => simulateUnconfirmedDose(currentMedication.id)}
                title="Developer Tool: Immediately trigger unconfirmed dose follow-up workflow"
                className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold text-xs sm:text-sm border border-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Play className="w-4 h-4 text-amber-700 fill-amber-700" />
                <span>Simulate Unconfirmed Dose</span>
              </button>
            )}
            <Link
              to="/medications"
              className="text-base font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
            >
              <span>All Medications</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {currentMedication ? (
          <div
            className={`rounded-3xl border-4 p-6 sm:p-8 shadow-elevated space-y-6 ${
              currentMedication.status === 'unconfirmed'
                ? 'bg-rose-50/50 border-rose-400'
                : currentMedication.status === 'snoozed'
                ? 'bg-purple-50/50 border-purple-400'
                : 'bg-white border-amber-400'
            }`}
          >
            {/* Active Task Banner if Unconfirmed */}
            {activeTask && (
              <div className="bg-rose-100 border-2 border-rose-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-950">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                  <div>
                    <div className="font-extrabold text-base">
                      Caregiver Follow-Up Active: {activeTask.status.toUpperCase()}
                    </div>
                    <div className="text-xs sm:text-sm text-rose-800">
                      Assigned to <strong>{activeTask.assignedCaregiverName}</strong>. Reason: {activeTask.followUpReason}
                    </div>
                  </div>
                </div>
                {activeTask.status === 'acknowledged' && (
                  <Badge variant="teal" size="md">
                    Sarah is checking on you
                  </Badge>
                )}
              </div>
            )}

            {/* Pill Details */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div
                  className="w-24 h-24 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-md shrink-0"
                  style={{ backgroundColor: currentMedication.pillColor }}
                >
                  {currentMedication.shape === 'capsule' ? '💊' : '⚪'}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        currentMedication.status === 'unconfirmed'
                          ? 'danger'
                          : currentMedication.status === 'snoozed'
                          ? 'purple'
                          : 'warning'
                      }
                      size="md"
                    >
                      Scheduled for {currentMedication.scheduleTime}
                    </Badge>
                    <span className="text-sm text-slate-500 font-semibold">Today</span>
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-black text-slate-900">
                    {currentMedication.name}
                  </h3>
                  <p className="text-xl font-bold text-slate-700">
                    Dosage: {currentMedication.dosage}
                  </p>
                  <p className="text-base text-slate-600 italic">
                    "{currentMedication.instructions}"
                  </p>
                </div>
              </div>

              {currentMedication.prescribedBy && (
                <div className="text-xs font-semibold text-slate-500 bg-slate-100 p-3 rounded-2xl border border-slate-200">
                  Prescribing Physician:<br />
                  <strong className="text-slate-800">{currentMedication.prescribedBy}</strong>
                </div>
              )}
            </div>

            {/* The 4 Large Senior Interactions: Taken, Skip, Snooze, Need Help */}
            <div className="pt-2 border-t-2 border-slate-200">
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                Select Your Action:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Taken */}
                <Button
                  variant="emerald"
                  size="xl"
                  onClick={handleTakeDose}
                  className="text-lg sm:text-xl shadow-lg cursor-pointer"
                  icon={<Check className="w-8 h-8 stroke-[3]" />}
                >
                  Taken
                </Button>

                {/* 2. Skip */}
                <Button
                  variant="amber"
                  size="xl"
                  onClick={() => setShowSkipModal(true)}
                  className="text-lg sm:text-xl shadow-lg cursor-pointer"
                  icon={<RotateCcw className="w-7 h-7" />}
                >
                  Skip
                </Button>

                {/* 3. Snooze */}
                <Button
                  variant="purple"
                  size="xl"
                  onClick={() => setShowSnoozeModal(true)}
                  className="text-lg sm:text-xl shadow-lg cursor-pointer"
                  icon={<Clock className="w-7 h-7" />}
                >
                  Snooze
                </Button>

                {/* 4. Need Help */}
                <Button
                  variant="danger"
                  size="xl"
                  onClick={() => setShowHelpModal(true)}
                  className="text-lg sm:text-xl shadow-lg cursor-pointer"
                  icon={<HelpCircle className="w-8 h-8" />}
                >
                  Need Help
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Card className="text-center py-10 bg-emerald-50 border-2 border-emerald-300">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>
            <h3 className="text-2xl font-black text-emerald-900">All Done for Now!</h3>
            <p className="text-lg text-emerald-700 mt-1">
              You are completely up to date with your scheduled medications today.
            </p>
          </Card>
        )}
      </section>

      {/* Two Column Layout: Daily CareLoop & Quick Family Call */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Routine / CareLoop Checklist */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-teal-600" />
              <span>Today's Care Plan</span>
            </h2>
            <Link
              to="/care-loop"
              className="text-sm font-bold text-teal-700 hover:text-teal-800"
            >
              View Full Loop
            </Link>
          </div>

          <div className="space-y-3">
            {careLoop.slice(0, 4).map((item) => (
              <div
                key={item.id}
                onClick={() => toggleCareLoopItem(item.id)}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  item.completed
                    ? 'bg-slate-100/80 border-slate-200 text-slate-500'
                    : 'bg-white border-slate-200 hover:border-teal-500 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 ${
                      item.completed
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {item.completed && <Check className="w-6 h-6 stroke-[3]" />}
                  </div>
                  <div>
                    <div
                      className={`text-lg font-bold ${
                        item.completed ? 'line-through text-slate-500' : 'text-slate-900'
                      }`}
                    >
                      {item.title}
                    </div>
                    <div className="text-sm text-slate-500">{item.description}</div>
                  </div>
                </div>

                <Badge variant={item.completed ? 'success' : 'teal'} size="sm">
                  {item.completed ? 'Done' : item.dueTime}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar: One-Tap Family Speed Dial & Appointments */}
        <div className="space-y-6">
          {/* Direct Speed Dial Card */}
          <Card highlight="teal" className="space-y-4">
            <div className="flex items-center gap-2 text-teal-800 font-bold text-base">
              <Heart className="w-5 h-5 text-teal-600 fill-teal-600" />
              <span>Call Your Family</span>
            </div>

            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80"
                alt="Sarah Vance"
                className="w-14 h-14 rounded-2xl object-cover border-2 border-teal-500 shadow"
              />
              <div>
                <h3 className="text-xl font-black text-slate-900">Sarah Vance</h3>
                <p className="text-sm font-semibold text-slate-500">Daughter • 15 mins away</p>
              </div>
            </div>

            <a
              href="tel:+15558765432"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-lg py-3.5 px-4 rounded-2xl inline-flex items-center justify-center gap-3 shadow-md"
            >
              <PhoneCall className="w-6 h-6" />
              <span>Call Sarah Now</span>
            </a>
          </Card>

          {/* Upcoming Appointment Snippet */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Next Appointment
              </span>
              <Calendar className="w-5 h-5 text-sky-600" />
            </div>

            <h4 className="text-lg font-black text-slate-900">Dr. Robert Chen, MD</h4>
            <p className="text-sm text-slate-600">
              Thursday, Nov 20 at 10:30 AM • Cardiovascular Review
            </p>
            <p className="text-xs text-sky-700 font-bold bg-sky-50 p-2 rounded-xl">
              Sarah will drive and accompany you.
            </p>

            <Link
              to="/appointments"
              className="text-sm font-bold text-teal-700 hover:text-teal-800 block pt-1"
            >
              View Appointment Details →
            </Link>
          </Card>
        </div>
      </div>

      {/* Skip Dose Modal */}
      {showSkipModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border-4 border-amber-400 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <RotateCcw className="w-6 h-6 text-amber-600" />
                <span>Skip Dose Today?</span>
              </h3>
              <button
                onClick={() => setShowSkipModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-base text-slate-600">
              Please select a reason so your caregiver Sarah and doctor can keep an accurate record:
            </p>

            <div className="space-y-2">
              {[
                'Feeling mild nausea this morning',
                'Doctor advised to pause today',
                'Already took it earlier without app',
                'Felt dizzy or unwell',
              ].map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                    skipReason === reason
                      ? 'border-amber-500 bg-amber-50 font-bold text-slate-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="skipReason"
                    checked={skipReason === reason}
                    onChange={() => setSkipReason(reason)}
                    className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="amber"
                size="md"
                fullWidth
                onClick={handleConfirmSkip}
                className="cursor-pointer"
              >
                Confirm Skip
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowSkipModal(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Snooze Modal */}
      {showSnoozeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border-4 border-purple-400 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-6 h-6 text-purple-600" />
                <span>Snooze Reminder</span>
              </h3>
              <button
                onClick={() => setShowSnoozeModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-base text-slate-600">
              When would you like Eleanor's gentle reminder to alert again?
            </p>

            <div className="grid grid-cols-3 gap-3">
              {[15, 30, 45].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setSnoozeMinutes(mins)}
                  className={`p-4 rounded-2xl border-2 font-black text-lg transition-all cursor-pointer ${
                    snoozeMinutes === mins
                      ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  +{mins} min
                </button>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="purple"
                size="md"
                fullWidth
                onClick={() => handleConfirmSnooze(snoozeMinutes)}
                className="cursor-pointer"
              >
                Snooze for {snoozeMinutes} Mins
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowSnoozeModal(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Need Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border-4 border-rose-500 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-rose-600" />
                <span>Request Help</span>
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-base text-slate-700">
              Tapping confirm will notify your primary caregiver <strong>Sarah Vance</strong> immediately to call or come assist you.
            </p>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                What do you need help with?
              </label>
              <input
                type="text"
                value={helpNote}
                onChange={(e) => setHelpNote(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-base"
                placeholder="e.g. Can't open pill bottle, feeling dizzy"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="danger"
                size="md"
                fullWidth
                onClick={handleConfirmNeedHelp}
                className="cursor-pointer"
              >
                Alert Sarah for Help
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowHelpModal(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
