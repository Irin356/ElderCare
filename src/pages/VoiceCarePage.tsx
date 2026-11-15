import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Smile,
  CheckCircle,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { useCare } from '../context/CareContext';

export const VoiceCarePage: React.FC = () => {
  const { voiceSessions } = useCare();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);

  const prompts = [
    {
      agent: "Good morning Eleanor! It's so lovely to speak with you today. Did you sleep peacefully?",
      senior: "Yes dear, I slept about 7 hours. The sun is shining nicely through the patio window.",
      sentiment: 'Cheerful & Well-Rested',
    },
    {
      agent: "That makes me so glad to hear. Have you had your breakfast oatmeal and morning water yet?",
      senior: "I had warm water with a slice of lemon and finished my oatmeal with blueberries.",
      sentiment: 'Hydrated & Nourished',
    },
    {
      agent: "Wonderful! Just a gentle reminder that Lisinopril is scheduled for 8:00 AM. Would you like me to mark it confirmed?",
      senior: "I just swallowed it with my breakfast, thank you!",
      sentiment: 'Medication Verified',
    },
  ];

  const handleToggleVoice = () => {
    if (!sessionActive) {
      setSessionActive(true);
      setIsSpeaking(true);
    } else {
      setIsSpeaking(!isSpeaking);
    }
  };

  const handleNextDialogue = () => {
    setCurrentPromptIndex((prev) => (prev + 1) % prompts.length);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-sm font-bold">
            <Mic className="w-5 h-5 text-teal-600" />
            <span>Conversational Health Companion</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            VoiceCare Companion
          </h1>
          <p className="text-base text-slate-600">
            Natural spoken conversations that check on health, monitor mood, and verify routines without screens.
          </p>
        </div>

        <Badge variant="teal" size="lg" icon={<Sparkles className="w-4 h-4" />}>
          Voice: Sarah's Cloned Voice
        </Badge>
      </div>

      {/* Main Interactive Voice Portal */}
      <div className="bg-gradient-to-b from-teal-800 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-elevated text-center relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-teal-500/10 backdrop-blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-400/20 text-teal-200 text-sm font-extrabold border border-teal-400/30">
            <Smile className="w-4 h-4" />
            <span>AI Care Companion: Maya • Cloned with Sarah's Voice</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black">
            {sessionActive ? 'Listening & Conversing with Eleanor' : 'Tap Below to Start Check-In'}
          </h2>

          {/* Interactive Microphone Button with Wave Animation */}
          <div className="py-6 flex items-center justify-center">
            <button
              onClick={handleToggleVoice}
              aria-label={sessionActive ? 'Mute or pause voice' : 'Start voice conversation'}
              className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer ${
                isSpeaking
                  ? 'bg-teal-500 text-white ring-8 ring-teal-400/50 scale-105 animate-pulse'
                  : 'bg-white text-teal-900 hover:scale-105'
              }`}
            >
              {isSpeaking ? (
                <div className="flex flex-col items-center">
                  <Mic className="w-16 h-16" />
                  <span className="text-xs font-black uppercase tracking-wider mt-1">Speaking</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <MicOff className="w-14 h-14 text-slate-600" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mt-1">
                    Tap to Talk
                  </span>
                </div>
              )}
            </button>
          </div>

          {/* Audio Waveform Graphic */}
          <div className="flex items-center justify-center gap-1.5 h-12">
            {[40, 75, 90, 50, 100, 80, 60, 95, 45, 85, 60, 30].map((h, i) => (
              <div
                key={i}
                className="w-1.5 sm:w-2 bg-teal-400 rounded-full transition-all duration-300"
                style={{
                  height: isSpeaking ? `${h}%` : '20%',
                  opacity: isSpeaking ? 1 : 0.4,
                }}
              />
            ))}
          </div>

          {/* Current Live Dialogue Bubble */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 text-left space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase text-teal-300 tracking-wider">
                Maya (AI in Sarah's Voice):
              </span>
              <p className="text-lg sm:text-xl font-bold text-white">
                "{prompts[currentPromptIndex].agent}"
              </p>
            </div>

            <div className="space-y-1 pt-2 border-t border-white/10">
              <span className="text-xs font-bold uppercase text-amber-300 tracking-wider">
                Eleanor (Senior Response):
              </span>
              <p className="text-lg sm:text-xl font-medium text-teal-100">
                "{prompts[currentPromptIndex].senior}"
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Sentiment: {prompts[currentPromptIndex].sentiment}
              </span>
              <button
                onClick={handleNextDialogue}
                className="text-xs font-bold bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl cursor-pointer"
              >
                Next Dialogue Prompt →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Voice Sessions Log */}
      <section className="space-y-4">
        <h3 className="text-2xl font-black text-slate-900">
          Past Voice Conversations & Mood Reports
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {voiceSessions.map((session) => (
            <Card key={session.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-teal-600" />
                  <span className="text-sm font-bold text-slate-900">
                    {session.date} at {session.time}
                  </span>
                </div>
                <Badge
                  variant={
                    session.moodDetected === 'cheerful'
                      ? 'success'
                      : session.moodDetected === 'tired'
                      ? 'warning'
                      : 'info'
                  }
                  size="sm"
                >
                  {session.moodDetected}
                </Badge>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {session.summary}
              </p>

              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                {session.topicsDiscussed.map((topic, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-semibold"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};
