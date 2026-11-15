import React, { useState } from 'react';
import {
  History,
  Pill,
  Heart,
  Mic,
  FileText,
  AlertTriangle,
  Clock,
  Send,
  Sparkles,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useCare } from '../context/CareContext';
import { useAuth } from '../context/AuthContext';

export const SharedCareTimelinePage: React.FC = () => {
  const { timeline, addTimelineEvent, isDemoMode } = useCare();
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<string>('all');
  const [newNote, setNewNote] = useState('');
  const [postError, setPostError] = useState<string | null>(null);

  const filteredEvents = timeline.filter((event) => {
    if (filterType === 'all') return true;
    return event.type === filterType;
  });

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setPostError(null);
    try {
      await addTimelineEvent({
        timestamp: 'Just now',
        type: 'note',
        title: 'Family Care Note Added',
        description: newNote.trim(),
        author: {
          name: user.name,
          role: user.relationship || user.role,
          avatar: user.avatar,
        },
        severity: 'normal',
      });
      setNewNote('');
    } catch (error: unknown) {
      setPostError(error instanceof Error ? error.message : 'Timeline update failed.');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'medication':
        return <Pill className="w-5 h-5 text-amber-500" />;
      case 'vitals':
        return <Heart className="w-5 h-5 text-rose-500" />;
      case 'voice':
        return <Mic className="w-5 h-5 text-teal-600" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case 'activity':
        return <Activity className="w-5 h-5 text-emerald-600" />;
      default:
        return <FileText className="w-5 h-5 text-sky-600" />;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-sm font-bold">
            <History className="w-5 h-5 text-teal-600" />
            <span>Unified Family Care Journal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Shared Care Timeline
          </h1>
          <p className="text-base text-slate-600">
            Real-time activity feed synchronizing Eleanor, Sarah, Nurse Maria, and visiting doctors.
          </p>
        </div>

        <Badge variant={isDemoMode ? 'warning' : 'teal'} size="lg" icon={<ShieldCheck className="w-4 h-4" />}>
          {isDemoMode ? 'Demo — Device Only' : 'Realtime configured — test not verified'}
        </Badge>
      </div>

      {/* Quick Family Note Post Box */}
      <Card highlight="teal" className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-teal-600" />
          <h3 className="text-lg font-black text-slate-900">
            Post an Update or Observation
          </h3>
        </div>

        <form onSubmit={handlePostNote} className="space-y-3">
          {postError && <p role="alert" className="text-sm font-bold text-rose-700">{postError}</p>}
          <textarea
            rows={2}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder={`Leave a quick note for the care team (e.g., "Eleanor enjoyed her tea and took a 20min afternoon nap")...`}
            className="w-full p-4 rounded-2xl border-2 border-slate-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 text-base"
          />

          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">
              Posting as <strong>{user.name}</strong> ({user.relationship || user.role})
            </span>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={<Send className="w-4 h-4" />}
              iconPosition="right"
            >
              Post to Care Timeline
            </Button>
          </div>
        </form>
      </Card>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['all', 'medication', 'alert', 'vitals', 'voice', 'note', 'activity'].map((category) => (
          <button
            key={category}
            onClick={() => setFilterType(category)}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold capitalize shrink-0 transition-all cursor-pointer ${
              filterType === category
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {category === 'all' ? 'All Activity' : category}
          </button>
        ))}
      </div>

      {/* Chronological Timeline Feed */}
      <div className="relative border-l-4 border-teal-200 ml-4 sm:ml-6 pl-6 sm:pl-8 space-y-6">
        {filteredEvents.map((event) => {
          const isCritical = event.severity === 'critical';

          return (
            <div key={event.id} className="relative group">
              {/* Timeline Pin Indicator */}
              <div
                className={`absolute -left-[35px] sm:-left-[43px] top-1 w-9 h-9 rounded-2xl flex items-center justify-center border-2 border-white shadow-md ${
                  isCritical
                    ? 'bg-rose-600 text-white animate-bounce'
                    : 'bg-teal-50 text-teal-800 border-teal-300'
                }`}
              >
                {getTypeIcon(event.type)}
              </div>

              {/* Event Card */}
              <div
                className={`rounded-3xl border-2 p-5 sm:p-6 transition-all ${
                  isCritical
                    ? 'bg-rose-50 border-rose-300 shadow-md'
                    : 'bg-white border-slate-200 shadow-soft hover:border-teal-400'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xl font-black text-slate-900 leading-tight">
                      {event.title}
                    </h4>
                    {isCritical && (
                      <Badge variant="danger" size="sm">
                        Urgent
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{event.timestamp}</span>
                  </div>
                </div>

                <p className="text-base text-slate-700 leading-relaxed font-medium">
                  {event.description}
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-100 text-xs text-slate-500">
                  {event.author.avatar ? (
                    <img
                      src={event.author.avatar}
                      alt={event.author.name}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px]">
                      {event.author.name.charAt(0)}
                    </span>
                  )}
                  <span>
                    Logged by <strong className="text-slate-800">{event.author.name}</strong> • {event.author.role}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
