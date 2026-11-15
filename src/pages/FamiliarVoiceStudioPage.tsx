import React, { useState } from 'react';
import {
  AudioWaveform,
  Mic,
  Square,
  Play,
  Sparkles,
  CheckCircle2,
  Volume2,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useCare } from '../context/CareContext';

export const FamiliarVoiceStudioPage: React.FC = () => {
  const { voiceProfiles } = useCare();
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [sampleSaved, setSampleSaved] = useState(false);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);

  const scriptSample =
    '"Good morning Mom! I hope you had a restful night. Remember to drink your warm lemon water and take your Lisinopril with breakfast. I love you and will see you at five!"';

  const handleToggleRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordSeconds(0);
      const timer = setInterval(() => {
        setRecordSeconds((sec) => {
          if (sec >= 15) {
            clearInterval(timer);
            setIsRecording(false);
            setSampleSaved(true);
            return 15;
          }
          return sec + 1;
        });
      }, 1000);
    } else {
      setIsRecording(false);
      setSampleSaved(true);
    }
  };

  const handlePlayPreview = (id: string) => {
    setActivePreviewId(id);
    setTimeout(() => {
      setActivePreviewId(null);
    }, 3000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-700 text-sm font-bold">
            <AudioWaveform className="w-5 h-5 text-purple-600" />
            <span>AI Voice Synthesis & Cloning Lab</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Familiar Voice Studio
          </h1>
          <p className="text-base text-slate-600">
            Train ElderCare AI to speak with the comforting voices of loving family members.
          </p>
        </div>

        <Badge variant="teal" size="lg" icon={<Sparkles className="w-4 h-4" />}>
          3 Voice Models Enrolled
        </Badge>
      </div>

      {/* Recording Studio Card */}
      <Card highlight="teal" className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Mic className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Record a New Voice Sample
              </h2>
              <p className="text-xs text-slate-500">
                Read the prompt below in a warm, relaxed speaking voice for 15 seconds.
              </p>
            </div>
          </div>

          <span className="text-xs font-bold px-3 py-1 bg-purple-100 text-purple-900 rounded-full">
            High Fidelity HD Voice
          </span>
        </div>

        {/* Script Box */}
        <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Read This Prompt Aloud:
          </span>
          <p className="text-lg sm:text-xl font-bold text-slate-800 italic">
            {scriptSample}
          </p>
        </div>

        {/* Recording Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-4">
            <button
              onClick={handleToggleRecord}
              className={`px-6 py-3.5 rounded-2xl font-black text-base flex items-center gap-3 shadow-md transition-all cursor-pointer ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-5 h-5 fill-white" />
                  <span>Stop Recording ({recordSeconds}s / 15s)</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  <span>Start 15s Sample</span>
                </>
              )}
            </button>

            {sampleSaved && (
              <span className="text-emerald-700 text-sm font-bold flex items-center gap-1.5 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Sample uploaded & ready for fine-tuning!
              </span>
            )}
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            Recorded samples are encrypted and securely stored in compliance with HIPAA.
          </div>
        </div>
      </Card>

      {/* Voice Models List */}
      <section className="space-y-4">
        <h3 className="text-2xl font-black text-slate-900">
          Enrolled Voice Models
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {voiceProfiles.map((profile) => {
            const isPlaying = activePreviewId === profile.id;

            return (
              <Card
                key={profile.id}
                highlight={profile.status === 'ready' ? 'teal' : 'none'}
                className="space-y-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-200 shadow-sm"
                  />
                  <div>
                    <h4 className="text-lg font-black text-slate-900">{profile.name}</h4>
                    <p className="text-xs font-bold text-slate-500">{profile.relation}</p>
                    <Badge
                      variant={profile.status === 'ready' ? 'success' : 'warning'}
                      size="sm"
                      className="mt-1"
                    >
                      {profile.status === 'ready' ? 'Active & Ready' : 'Training (60%)'}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {profile.description}
                </p>

                <div className="text-xs text-slate-400 font-semibold">
                  {profile.sampleCount} voice samples • {profile.lastTrained}
                </div>

                <div className="pt-2">
                  <Button
                    variant={isPlaying ? 'primary' : 'outline'}
                    size="sm"
                    fullWidth
                    onClick={() => handlePlayPreview(profile.id)}
                    icon={isPlaying ? <Volume2 className="w-4 h-4 animate-bounce" /> : <Play className="w-4 h-4" />}
                  >
                    {isPlaying ? 'Playing Sample Voice...' : 'Preview Voice Audio'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
};
