import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Check,
  Droplets,
  Heart,
  Footprints,
  Apple,
  Smile,
  Clock,
  AlertTriangle,
  Play,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { useCare } from '../context/CareContext';

export const CareLoopPage: React.FC = () => {
  const {
    careLoop,
    toggleCareLoopItem,
    followUpTasks,
    simulateUnconfirmedDose,
    isDemoMode,
  } = useCare();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Tasks', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'vitals', label: 'Vitals & BP', icon: <Heart className="w-5 h-5 text-rose-500" /> },
    { id: 'hydration', label: 'Hydration', icon: <Droplets className="w-5 h-5 text-sky-500" /> },
    { id: 'activity', label: 'Activity & Walks', icon: <Footprints className="w-5 h-5 text-emerald-500" /> },
    { id: 'nutrition', label: 'Nutrition', icon: <Apple className="w-5 h-5 text-amber-500" /> },
    { id: 'mood', label: 'Mood & Voice', icon: <Smile className="w-5 h-5 text-purple-500" /> },
  ];

  const filteredItems = careLoop.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  const completedCount = careLoop.filter((i) => i.completed).length;
  const progressPercent = Math.round((completedCount / careLoop.length) * 100);
  const activeFollowUps = followUpTasks.filter((t) => t.status !== 'resolved');

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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-sm font-bold">
            <CheckSquare className="w-5 h-5 text-teal-600" />
            <span>Continuous Daily Routine & Medication Follow-Up</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            CareLoop Engine
          </h1>
          <p className="text-base text-slate-600">
            Automated detection, caregiver assignment, escalation and resolution workflow.
          </p>
        </div>

        {/* Big Adherence Indicator */}
        <div className="bg-white rounded-3xl border-2 border-teal-200 p-5 shadow-soft flex items-center gap-5">
          <div className="relative w-16 h-16 flex items-center justify-center bg-teal-50 rounded-full border-4 border-teal-500">
            <span className="text-xl font-black text-teal-900">{progressPercent}%</span>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">
              {completedCount} of {careLoop.length} Routine Tasks Done
            </div>
            <div className="text-xs text-slate-500">
              {activeFollowUps.length > 0
                ? `⚠️ ${activeFollowUps.length} follow-up task active`
                : 'All medication doses confirmed'}
            </div>
          </div>
        </div>
      </div>

      {/* CareLoop Medication Workflow Explainer Ribbon */}
      <section className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-elevated space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-700/60 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-300" />
            <h2 className="text-lg font-black tracking-wide">
              Automated Medication Follow-Up Lifecycle
            </h2>
          </div>
          <button
            onClick={() => simulateUnconfirmedDose()}
            className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>Simulate Unconfirmed Dose</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10 space-y-1">
            <span className="font-extrabold text-teal-300 text-sm">1. Reminder</span>
            <p className="text-teal-100">
              Senior is prompted with 4 actions: Taken, Skip, Snooze, Need Help.
            </p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10 space-y-1">
            <span className="font-extrabold text-amber-300 text-sm">2. Detection</span>
            <p className="text-amber-100">
              Unconfirmed after 45m grace period auto-assigns primary caregiver (Sarah).
            </p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10 space-y-1">
            <span className="font-extrabold text-purple-300 text-sm">3. Escalation</span>
            <p className="text-purple-100">
              Unresolved follow-up escalates to Nurse Maria & backup circle.
            </p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10 space-y-1">
            <span className="font-extrabold text-emerald-300 text-sm">4. Resolution</span>
            <p className="text-emerald-100">
              Caregiver verifies actual outcome (taken, skipped, unavailable) & logs timeline.
            </p>
          </div>
        </div>
      </section>

      {/* Active CareLoop Follow-Up Tasks */}
      {activeFollowUps.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
              <span>Active CareLoop Follow-Up Tasks ({activeFollowUps.length})</span>
            </h2>
            <Link to="/caregiver-dashboard">
              <Button variant="outline" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                Open Caregiver View
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {activeFollowUps.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-3xl border-3 border-rose-300 p-6 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={task.status === 'escalated' ? 'purple' : 'danger'} size="sm">
                      {task.status.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-slate-500 font-bold">
                      Scheduled: {task.scheduledTime}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900">
                    {task.medicationName} ({task.dosage})
                  </h3>
                  <p className="text-sm text-rose-900 font-semibold">{task.followUpReason}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Assigned to: <strong>{task.assignedCaregiverName}</strong>
                    {task.acknowledgedBy && ` • Acknowledged by ${task.acknowledgedBy}`}
                    {task.escalatedToCaregiverName && ` • Escalated to ${task.escalatedToCaregiverName}`}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link to="/caregiver-dashboard">
                    <Button variant="primary" size="sm">
                      Manage in Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Routine CareLoop Checklist */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900">Today's Routine Wellness Loop</h2>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tap item to toggle
          </span>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* List of Routine Cards */}
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleCareLoopItem(item.id)}
              className={`p-6 rounded-3xl border-3 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                item.completed
                  ? 'bg-emerald-50/50 border-emerald-300'
                  : 'bg-white border-slate-200 hover:border-teal-500 shadow-soft'
              }`}
            >
              <div className="flex items-start sm:items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 shrink-0 transition-colors ${
                    item.completed
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                      : 'bg-slate-50 border-slate-300 hover:border-teal-600'
                  }`}
                >
                  {item.completed && <Check className="w-7 h-7 stroke-[3]" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-xl sm:text-2xl font-extrabold ${
                        item.completed ? 'line-through text-slate-500' : 'text-slate-900'
                      }`}
                    >
                      {item.title}
                    </h3>
                    {item.priority === 'urgent' && !item.completed && (
                      <Badge variant="danger" size="sm">
                        Priority
                      </Badge>
                    )}
                  </div>
                  <p className="text-base text-slate-600 mt-0.5">{item.description}</p>
                  {item.completed && item.completedAt && (
                    <p className="text-xs text-emerald-700 font-bold mt-1">
                      ✓ Completed at {item.completedAt} by {item.completedBy || 'Eleanor'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <Badge
                  variant={item.completed ? 'success' : 'teal'}
                  size="md"
                  icon={<Clock className="w-4 h-4" />}
                >
                  {item.completed ? 'Done' : item.dueTime}
                </Badge>
                <button
                  className={`px-4 py-2 rounded-xl text-sm font-bold border cursor-pointer ${
                    item.completed
                      ? 'bg-white text-slate-600 border-slate-300'
                      : 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700'
                  }`}
                >
                  {item.completed ? 'Undo' : 'Complete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
