import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Mic,
  Users,
  Pill,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { useAuth } from '../context/AuthContext';

export const WelcomePage: React.FC = () => {
  const { switchRole, isDemoMode } = useAuth();

  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 rounded-3xl text-white p-8 sm:p-12 lg:p-16 shadow-elevated">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/20 border border-teal-300/40 text-teal-200 text-sm font-bold tracking-wide">
            <Sparkles className="w-4 h-4 text-teal-300" />
            <span>Next-Generation Compassionate Elder Care</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Caring for Those Who Cared for Us.
          </h1>

          <p className="text-lg sm:text-xl text-teal-100 font-medium leading-relaxed">
            ElderCare bridges seniors and families with gentle AI voice companions,
            effortless one-tap medication logging, shared family loops, and instant emergency reassurance.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              to={isDemoMode ? '/elderly-dashboard' : '/login'}
              onClick={isDemoMode ? () => switchRole('elderly') : undefined}
              className="inline-block"
            >
              <Button
                variant="primary"
                size="xl"
                className="w-full sm:w-auto bg-white text-teal-900 hover:bg-teal-50 border-white shadow-xl"
                icon={<ArrowRight className="w-6 h-6 text-teal-700" />}
                iconPosition="right"
              >
                {isDemoMode ? 'Senior Mode (One-Tap View)' : 'Sign In to Care Portal'}
              </Button>
            </Link>

            <Link
              to={isDemoMode ? '/caregiver-dashboard' : '/login'}
              onClick={isDemoMode ? () => switchRole('caregiver') : undefined}
              className="inline-block"
            >
              <Button
                variant="outline"
                size="xl"
                className="w-full sm:w-auto bg-teal-900/40 text-white border-teal-400/50 hover:bg-teal-900/60"
                icon={<Users className="w-6 h-6 text-teal-300" />}
              >
                {isDemoMode ? 'Caregiver & Family Portal' : 'Sign In to Care Portal'}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Value Pillars Grid */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900">
            Engineered for Senior Independence & Family Peace of Mind
          </h2>
          <p className="text-base text-slate-600">
            Every screen is built with high-contrast typography, large touch targets, and compassionate voice guidance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card highlight="teal" className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Mic className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900">VoiceCare Companion</h3>
            <p className="text-slate-600 leading-relaxed">
              Gentle conversational check-ins that sound like family members. Monitors mood, verifies meals and medication without screens.
            </p>
            <Link
              to="/voice-care"
              className="inline-flex items-center text-teal-700 font-extrabold hover:text-teal-800 gap-1 text-sm pt-2"
            >
              <span>Explore VoiceCare</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Card>

          <Card highlight="amber" className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Pill className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Visual Pill Schedule</h3>
            <p className="text-slate-600 leading-relaxed">
              Clear pill shapes, colors, dosages, and audio prompts. Confirmed in one giant tap with instant family notification.
            </p>
            <Link
              to="/medications"
              className="inline-flex items-center text-amber-700 font-extrabold hover:text-amber-800 gap-1 text-sm pt-2"
            >
              <span>View Medications</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Card>

          <Card highlight="sky" className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900">CareCircle & Timeline</h3>
            <p className="text-slate-600 leading-relaxed">
              Connect children, grandkids, visiting nurses, and physicians into a synchronized, transparent care circle with no missed steps.
            </p>
            <Link
              to="/care-circle"
              className="inline-flex items-center text-sky-700 font-extrabold hover:text-sky-800 gap-1 text-sm pt-2"
            >
              <span>Open CareCircle</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Card>
        </div>
      </section>

      {/* Safety & Trust Banner */}
      <section className="bg-slate-100 rounded-3xl p-6 sm:p-8 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-900">Always-On Safety & SOS Reassurance</h4>
            <p className="text-sm text-slate-600">
              One-touch emergency dispatch directly alerts assigned family members and emergency response with live GPS location.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="outline" size="md">
              Sign In to Account
            </Button>
          </Link>
          <Link to="/elderly-dashboard">
            <Button variant="primary" size="md">
              Launch App
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};
