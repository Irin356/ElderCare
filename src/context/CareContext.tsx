import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  Medication,
  CareLoopItem,
  CareCircleMember,
  VoiceCareSession,
  VoiceProfile,
  Appointment,
  TimelineEvent,
  FollowUpTask,
  FollowUpResolutionType,
} from '../types';
import { supabaseCareLoop } from '../services/supabaseCareLoop';
import { careLoopFormatting } from '../services/supabaseCareLoop';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'eldercare_careloop_state_v2';

interface CareContextType {
  medications: Medication[];
  careLoop: CareLoopItem[];
  careCircle: CareCircleMember[];
  voiceSessions: VoiceCareSession[];
  voiceProfiles: VoiceProfile[];
  appointments: Appointment[];
  timeline: TimelineEvent[];
  followUpTasks: FollowUpTask[];
  emergencyAlertActive: boolean;
  activeVoiceAssistant: boolean;
  isDemoMode: boolean;
  isLoading: boolean;
  persistenceError: string | null;
  clearPersistenceError: () => void;
  activeElderId: string | null;
  elderlyName: string | null;
  refreshCareData: () => Promise<void>;
  createCareInvite: (
    role: string,
    relationship: string,
    phone?: string,
    canManageMeds?: boolean
  ) => Promise<string>;
  acceptCareInvite: (code: string) => Promise<void>;

  // Medication Dose Actions (Elderly Dashboard)
  recordDoseTaken: (id: string, actor?: { name: string; role: string }) => void;
  recordDoseSkipped: (id: string, reason?: string, actor?: { name: string; role: string }) => void;
  recordDoseSnoozed: (id: string, minutes?: number, actor?: { name: string; role: string }) => void;
  recordDoseNeedHelp: (id: string, details?: string, actor?: { name: string; role: string }) => void;
  markMedicationTaken: (id: string) => void;

  // Caregiver Follow-Up Workflow Actions
  simulateUnconfirmedDose: (medicationId?: string) => FollowUpTask | null;
  detectUnconfirmedDoses: () => FollowUpTask[];
  acknowledgeFollowUpTask: (taskId: string, caregiver: { id: string; name: string }) => void;
  escalateFollowUpTask: (taskId: string, force?: boolean) => void;
  resolveFollowUpTask: (
    taskId: string,
    resolution: { type: FollowUpResolutionType; label: string; notes?: string },
    caregiver: { name: string; role: string }
  ) => void;

  // General Actions
  toggleCareLoopItem: (id: string) => void;
  addTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'timeAgo'>) => void | Promise<void>;
  triggerEmergencyAlert: () => void;
  dismissEmergencyAlert: () => void;
  addAppointment: (appt: Omit<Appointment, 'id'>) => void;
  setActiveVoiceAssistant: (active: boolean) => void;
  resetDemoData: () => void;
}

const INITIAL_MEDICATIONS: Medication[] = [
  {
    id: 'med-1',
    name: 'Lisinopril',
    dosage: '10mg (1 tablet)',
    scheduleTime: '08:00 AM',
    instructions: 'Take with full glass of water with breakfast',
    pillColor: '#F59E0B',
    shape: 'round',
    status: 'taken',
    takenAt: '08:15 AM today',
    prescribedBy: 'Dr. Robert Chen, Cardiologist',
  },
  {
    id: 'med-2',
    name: 'Metformin',
    dosage: '500mg (1 capsule)',
    scheduleTime: '12:30 PM',
    instructions: 'Take right after lunch to avoid stomach irritation',
    pillColor: '#0EA5E9',
    shape: 'capsule',
    status: 'scheduled',
    prescribedBy: 'Dr. Sarah Lin, Endocrinologist',
  },
  {
    id: 'med-3',
    name: 'Calcium & Vitamin D3',
    dosage: '600mg / 400 IU',
    scheduleTime: '06:00 PM',
    instructions: 'Take with evening meal',
    pillColor: '#10B981',
    shape: 'oval',
    status: 'scheduled',
    prescribedBy: 'Dr. Amanda Clark, Geriatrician',
  },
  {
    id: 'med-4',
    name: 'Atorvastatin',
    dosage: '20mg (1 tablet)',
    scheduleTime: '09:00 PM',
    instructions: 'Take before sleeping',
    pillColor: '#8B5CF6',
    shape: 'round',
    status: 'scheduled',
    prescribedBy: 'Dr. Robert Chen, Cardiologist',
  },
];

const INITIAL_CARE_LOOP: CareLoopItem[] = [
  {
    id: 'loop-1',
    title: 'Morning Blood Pressure Check',
    description: 'Target reading under 130/80 mmHg. Log with Omron cuff.',
    category: 'vitals',
    dueTime: '08:30 AM',
    completed: true,
    completedAt: '08:25 AM',
    completedBy: 'Eleanor Vance',
    priority: 'urgent',
  },
  {
    id: 'loop-2',
    title: 'Morning Hydration (1 Glass of Water)',
    description: 'Drink 250ml warm water or lemon herbal tea.',
    category: 'hydration',
    dueTime: '09:00 AM',
    completed: true,
    completedAt: '09:05 AM',
    completedBy: 'Eleanor Vance',
    priority: 'routine',
  },
  {
    id: 'loop-3',
    title: 'Midday 15-Minute Garden Walk',
    description: 'Gentle mobility walk on patio with walking cane.',
    category: 'activity',
    dueTime: '11:30 AM',
    completed: false,
    priority: 'important',
  },
  {
    id: 'loop-4',
    title: 'Lunchtime Blood Glucose Log',
    description: 'Record finger-prick glucose value before 12:30 PM lunch.',
    category: 'vitals',
    dueTime: '12:15 PM',
    completed: false,
    priority: 'important',
  },
  {
    id: 'loop-5',
    title: 'Afternoon Hydration & Protein Snack',
    description: 'Greek yogurt with fresh berries and herbal tea.',
    category: 'nutrition',
    dueTime: '03:30 PM',
    completed: false,
    priority: 'routine',
  },
  {
    id: 'loop-6',
    title: 'Evening Voice Check-in with Maya',
    description: 'Short 3-minute evening conversation to review day & mood.',
    category: 'mood',
    dueTime: '07:30 PM',
    completed: false,
    priority: 'important',
  },
];

const INITIAL_CARE_CIRCLE: CareCircleMember[] = [
  {
    id: 'circ-1',
    name: 'Sarah Vance',
    role: 'Primary Caregiver & Daughter',
    relation: 'Daughter',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    phone: '+1 (555) 876-5432',
    isOnline: true,
    isPrimaryContact: true,
    canManageMeds: true,
    location: '15 mins away (West End)',
    lastActive: 'Active right now',
  },
  {
    id: 'circ-2',
    name: 'David Vance',
    role: 'Son (Emergency Backup)',
    relation: 'Son',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    phone: '+1 (555) 432-8765',
    isOnline: false,
    isPrimaryContact: false,
    canManageMeds: true,
    location: 'Chicago, IL (Remote Backup)',
    lastActive: '2 hours ago',
  },
  {
    id: 'circ-3',
    name: 'Nurse Maria Gomez',
    role: 'Home Health Visiting Nurse (Secondary Escalation)',
    relation: 'Care Professional',
    avatar: 'https://images.unsplash.com/photo-1594824813572-8f195655761a?auto=format&fit=crop&w=256&q=80',
    phone: '+1 (555) 765-4321',
    isOnline: true,
    isPrimaryContact: false,
    canManageMeds: true,
    location: 'St. Jude Home Care',
    lastActive: 'Active 20m ago',
  },
  {
    id: 'circ-4',
    name: 'Emma (Granddaughter)',
    role: 'Family Companion & Storyteller',
    relation: 'Granddaughter',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    phone: '+1 (555) 998-1122',
    isOnline: false,
    isPrimaryContact: false,
    canManageMeds: false,
    location: 'Seattle, WA',
    lastActive: 'Yesterday',
  },
];

const INITIAL_VOICE_SESSIONS: VoiceCareSession[] = [
  {
    id: 'vses-1',
    date: 'Today',
    time: '08:45 AM',
    durationSeconds: 195,
    moodDetected: 'cheerful',
    summary: 'Eleanor sounded bright and rested. She mentioned sleeping 7.5 hours and looking forward to tending her patio hydrangeas.',
    topicsDiscussed: ['Good sleep', 'Breakfast oatmeal', 'Garden plants', 'Morning medication confirmation'],
    alertsTriggered: [],
  },
  {
    id: 'vses-2',
    date: 'Yesterday',
    time: '07:15 PM',
    durationSeconds: 240,
    moodDetected: 'calm',
    summary: 'Evening unwind check-in. Confirmed Lisinopril and evening vitamins taken. Eleanor listened to a bedtime story in daughter Sarah’s voice.',
    topicsDiscussed: ['Granddaughter Emma school update', 'Hydration', 'Evening relaxation'],
    alertsTriggered: [],
  },
  {
    id: 'vses-3',
    date: 'Nov 13, 2026',
    time: '02:20 PM',
    durationSeconds: 160,
    moodDetected: 'tired',
    summary: 'Noticed slight fatigue after physical therapy walk. Prompted a glass of water and 30-minute recliner rest.',
    topicsDiscussed: ['Mild knee stiffness', 'Rest recommendation', 'Water intake'],
    alertsTriggered: ['Mild knee stiffness noted for Nurse Maria'],
  },
];

const INITIAL_VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'vp-1',
    name: "Sarah's Gentle Voice",
    relation: 'Daughter (Sarah Vance)',
    sampleCount: 24,
    status: 'ready',
    description: 'Warm, reassuring tone used for daily medication reminders, morning greetings, and doctor visit notices.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    lastTrained: 'Yesterday at 3:15 PM',
  },
  {
    id: 'vp-2',
    name: "Emma's Storyteller Voice",
    relation: 'Granddaughter (Emma)',
    sampleCount: 18,
    status: 'ready',
    description: 'Youthful, joyful cadence specially tuned for reading bedtime stories, family audio postcards, and memory prompts.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    lastTrained: '3 days ago',
  },
  {
    id: 'vp-3',
    name: "Dr. Chen's Clinical Voice",
    relation: 'Cardiologist Office Companion',
    sampleCount: 12,
    status: 'training',
    description: 'Clear, steady medical voice for post-checkup recovery guidelines and heart rate instructions.',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=256&q=80',
    lastTrained: 'Processing audio samples...',
  },
];

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'appt-1',
    doctorName: 'Dr. Robert Chen, MD',
    specialty: 'Cardiovascular Care',
    clinic: 'Mercy Heart & Vascular Institute, Suite 410',
    date: 'Thursday, Nov 20, 2026',
    time: '10:30 AM',
    type: 'in-person',
    status: 'upcoming',
    notes: 'Routine 6-month checkup. Review 30-day blood pressure logs and Lisinopril efficacy. Bring medication list.',
    phone: '+1 (555) 443-2211',
    companionAssigned: 'Sarah Vance (Accompanying in person)',
  },
  {
    id: 'appt-2',
    doctorName: 'Dr. Amanda Clark, MD',
    specialty: 'Geriatric Wellness & Cognitive Health',
    clinic: 'St. Jude Senior Health Center',
    date: 'Monday, Dec 1, 2026',
    time: '02:00 PM',
    type: 'video',
    status: 'upcoming',
    notes: 'Quarterly wellness review. Review sleep patterns, joint mobility, and appetite.',
    phone: '+1 (555) 667-8899',
    companionAssigned: 'Nurse Maria Gomez joining on call',
  },
  {
    id: 'appt-3',
    doctorName: 'Dr. Kenneth Wong, OD',
    specialty: 'Ophthalmology & Vision Care',
    clinic: 'ClearSight Eye Clinic',
    date: 'Nov 04, 2026',
    time: '11:00 AM',
    type: 'in-person',
    status: 'completed',
    notes: 'Bifocal prescription renewed. Macular degeneration screening was normal.',
    phone: '+1 (555) 334-9988',
  },
];

const INITIAL_TIMELINE: TimelineEvent[] = [
  {
    id: 'tl-1',
    timestamp: 'Today at 09:05 AM',
    timeAgo: 'Just now',
    type: 'activity',
    title: 'Hydration Logged',
    description: 'Eleanor drank 250ml warm lemon herbal tea.',
    author: {
      name: 'Eleanor Vance',
      role: 'Care Recipient',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
    },
    severity: 'normal',
  },
  {
    id: 'tl-2',
    timestamp: 'Today at 08:45 AM',
    timeAgo: '40m ago',
    type: 'voice',
    title: 'VoiceCare Morning Check-in Completed',
    description: "3-min voice session with Maya AI using Sarah's voice model. Eleanor was cheerful, slept well, and confirmed medication readiness.",
    author: {
      name: 'VoiceCare Companion',
      role: 'AI System',
    },
    severity: 'normal',
  },
  {
    id: 'tl-3',
    timestamp: 'Today at 08:25 AM',
    timeAgo: '1h ago',
    type: 'vitals',
    title: 'Morning Blood Pressure Logged',
    description: 'Result: 122/78 mmHg with pulse 71 bpm. Within optimal target zone (<130/80).',
    author: {
      name: 'Eleanor Vance',
      role: 'Care Recipient',
    },
    severity: 'normal',
  },
  {
    id: 'tl-4',
    timestamp: 'Today at 08:15 AM',
    timeAgo: '1h 10m ago',
    type: 'medication',
    title: 'Lisinopril 10mg Taken',
    description: 'Confirmed taken with breakfast by Eleanor with tap confirmation.',
    author: {
      name: 'Sarah Vance',
      role: 'Primary Caregiver',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    },
    severity: 'normal',
  },
  {
    id: 'tl-5',
    timestamp: 'Yesterday at 05:30 PM',
    timeAgo: 'Yesterday',
    type: 'note',
    title: 'Nurse Maria Home Visit Report',
    description: 'Routine weekly visit: vitals stable, bilateral lung sounds clear, mobility test score 9/10. Recommended continuing garden walks.',
    author: {
      name: 'Nurse Maria Gomez',
      role: 'Home Health Visiting Nurse',
      avatar: 'https://images.unsplash.com/photo-1594824813572-8f195655761a?auto=format&fit=crop&w=256&q=80',
    },
    severity: 'normal',
  },
];

// Load persisted state or fallback
const loadPersistedState = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse persisted state from localStorage:', err);
    return null;
  }
};

const CareContext = createContext<CareContextType | undefined>(undefined);

export const CareProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isDemoMode } = useAuth();
  const persisted = isDemoMode ? loadPersistedState() : null;

  const [medications, setMedications] = useState<Medication[]>(
    persisted?.medications || (isDemoMode ? INITIAL_MEDICATIONS : [])
  );
  const [careLoop, setCareLoop] = useState<CareLoopItem[]>(
    persisted?.careLoop || (isDemoMode ? INITIAL_CARE_LOOP : [])
  );
  const [careCircle, setCareCircle] = useState<CareCircleMember[]>(
    persisted?.careCircle || (isDemoMode ? INITIAL_CARE_CIRCLE : [])
  );
  const [voiceSessions] = useState<VoiceCareSession[]>(
    persisted?.voiceSessions || INITIAL_VOICE_SESSIONS
  );
  const [voiceProfiles] = useState<VoiceProfile[]>(
    persisted?.voiceProfiles || INITIAL_VOICE_PROFILES
  );
  const [appointments, setAppointments] = useState<Appointment[]>(
    persisted?.appointments || (isDemoMode ? INITIAL_APPOINTMENTS : [])
  );
  const [timeline, setTimeline] = useState<TimelineEvent[]>(
    persisted?.timeline || (isDemoMode ? INITIAL_TIMELINE : [])
  );
  const [followUpTasks, setFollowUpTasks] = useState<FollowUpTask[]>(
    persisted?.followUpTasks || []
  );
  const [activeElderId, setActiveElderId] = useState<string | null>(null);
  const [elderlyName, setElderlyName] = useState<string | null>(isDemoMode ? 'Eleanor Vance' : null);
  const [isLoading, setIsLoading] = useState(!isDemoMode);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [emergencyAlertActive, setEmergencyAlertActive] = useState<boolean>(false);
  const [activeVoiceAssistant, setActiveVoiceAssistant] = useState<boolean>(false);

  const loadLiveCare = useCallback(async () => {
    if (isDemoMode || !user.id) return;
    const snapshot = await supabaseCareLoop.loadCareLoop(user.id, user.role);
    setActiveElderId(snapshot.elderId);
    setElderlyName(snapshot.elderlyName);
    setMedications(snapshot.medications);
    setFollowUpTasks(snapshot.followUpTasks);
    setTimeline(snapshot.timeline);
    setCareCircle(snapshot.careCircle);
    setAppointments(snapshot.appointments);
    setIsLoading(false);
    setPersistenceError(null);
  }, [isDemoMode, user.id, user.role]);

  const loadLiveCareRef = useRef(loadLiveCare);
  loadLiveCareRef.current = loadLiveCare;

  useEffect(() => {
    if (isDemoMode || !user.id) {
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    void loadLiveCare().catch((error: unknown) => {
      if (!active) return;
      setIsLoading(false);
      setPersistenceError(error instanceof Error ? error.message : 'Failed to load care data.');
    });
    return () => {
      active = false;
    };
  }, [isDemoMode, loadLiveCare, user.id]);

  useEffect(() => {
    if (isDemoMode || !activeElderId) return;
    const subscription = supabaseCareLoop.subscribeToCareLoopUpdates(
      activeElderId,
      () => {
        void loadLiveCareRef.current().catch((error: unknown) => {
          setPersistenceError(error instanceof Error ? error.message : 'Failed to refresh care data.');
        });
      },
      (error) => setPersistenceError(error.message)
    );
    return () => subscription.unsubscribe();
  }, [activeElderId, isDemoMode]);

  const runLiveMutation = async (operation: () => Promise<unknown>): Promise<boolean> => {
    if (!activeElderId) {
      setPersistenceError('No accessible elder profile is linked to this account.');
      return false;
    }
    setPersistenceError(null);
    try {
      await operation();
      await loadLiveCareRef.current();
      return true;
    } catch (error: unknown) {
      setPersistenceError(error instanceof Error ? error.message : 'Care update failed.');
      return false;
    }
  };

  useEffect(() => {
    if (isDemoMode && typeof window !== 'undefined') {
      try {
        const stateToSave = {
          medications,
          careLoop,
          appointments,
          timeline,
          followUpTasks,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      } catch (err) {
        console.warn('Failed to persist CareLoop state to localStorage:', err);
      }
    }
  }, [isDemoMode, medications, careLoop, appointments, timeline, followUpTasks]);

  const addTimelineEvent = (event: Omit<TimelineEvent, 'id' | 'timeAgo'>) => {
    const newEvent: TimelineEvent = {
      ...event,
      id: `tl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timeAgo: 'Just now',
    };
    if (isDemoMode) {
      setTimeline((prev) => [newEvent, ...prev]);
    } else {
      return runLiveMutation(() =>
        supabaseCareLoop.recordCareActivity({
          elderId: activeElderId || '',
          type: newEvent.type,
          title: newEvent.title,
          description: newEvent.description,
          severity: newEvent.severity,
        })
      ).then((persisted) => {
        if (!persisted) throw new Error('The care timeline update was not saved.');
      });
    }
  };

  const recordLiveDose = (
    medicationId: string,
    status: 'taken' | 'skipped' | 'snoozed' | 'help_requested',
    notes?: string,
    snoozeUntil?: string
  ) => {
    const medication = medications.find((item) => item.id === medicationId);
    if (!medication) {
      setPersistenceError('That medication is not available in the active care profile.');
      return;
    }
    runLiveMutation(() =>
      supabaseCareLoop.recordDoseEvent({
        medicationId,
        status,
        scheduledFor: careLoopFormatting.occurrenceForToday(medication.scheduleTime),
        notes,
        snoozeUntil,
      })
    );
  };

  // 1. Record Dose Taken (Elderly Interaction)
  const recordDoseTaken = (id: string, actor?: { name: string; role: string }) => {
    if (!isDemoMode) {
      recordLiveDose(id, 'taken');
      return;
    }
    const actorName = actor?.name || 'Eleanor Vance';
    const actorRole = actor?.role || 'Care Recipient';
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMedications((prev) =>
      prev.map((med) => {
        if (med.id === id) {
          return {
            ...med,
            status: 'taken',
            takenAt: `${nowTime} today`,
            lastActionBy: actorName,
            lastActionAt: nowTime,
            snoozedUntil: undefined,
          };
        }
        return med;
      })
    );

    // If there is an open follow-up task for this medication, resolve it
    setFollowUpTasks((prev) =>
      prev.map((task) => {
        if (task.medicationId === id && task.status !== 'resolved') {
          return {
            ...task,
            status: 'resolved',
            resolvedAt: nowTime,
            resolvedBy: actorName,
            resolution: {
              type: 'dose_taken',
              label: 'Dose confirmed taken by elderly person',
              resolvedAt: nowTime,
              resolvedBy: actorName,
              resolvedByRole: actorRole,
            },
          };
        }
        return task;
      })
    );

    const targetMed = medications.find((m) => m.id === id);
    if (targetMed) {
      addTimelineEvent({
        timestamp: `${nowTime} today`,
        type: 'medication',
        title: `✓ ${targetMed.name} (${targetMed.dosage}) Taken`,
        description: `Confirmed taken at ${nowTime} by ${actorName}. Medication status updated to Taken.`,
        author: {
          name: actorName,
          role: actorRole,
        },
        severity: 'normal',
      });
    }
  };

  const markMedicationTaken = (id: string) => {
    recordDoseTaken(id);
  };

  // 2. Record Dose Skipped (Elderly Interaction)
  const recordDoseSkipped = (
    id: string,
    reason?: string,
    actor?: { name: string; role: string }
  ) => {
    if (!isDemoMode) {
      recordLiveDose(id, 'skipped', reason);
      return;
    }
    const actorName = actor?.name || 'Eleanor Vance';
    const actorRole = actor?.role || 'Care Recipient';
    const skipReason = reason || 'Senior preferred to skip this dose';
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMedications((prev) =>
      prev.map((med) => {
        if (med.id === id) {
          return {
            ...med,
            status: 'skipped',
            skippedReason: skipReason,
            lastActionBy: actorName,
            lastActionAt: nowTime,
            snoozedUntil: undefined,
          };
        }
        return med;
      })
    );

    // If an open task exists, resolve it with skipped outcome
    setFollowUpTasks((prev) =>
      prev.map((task) => {
        if (task.medicationId === id && task.status !== 'resolved') {
          return {
            ...task,
            status: 'resolved',
            resolvedAt: nowTime,
            resolvedBy: actorName,
            resolution: {
              type: 'dose_skipped',
              label: 'Dose skipped by elderly person',
              notes: skipReason,
              resolvedAt: nowTime,
              resolvedBy: actorName,
              resolvedByRole: actorRole,
            },
          };
        }
        return task;
      })
    );

    const targetMed = medications.find((m) => m.id === id);
    if (targetMed) {
      addTimelineEvent({
        timestamp: `${nowTime} today`,
        type: 'medication',
        title: `⚠️ ${targetMed.name} (${targetMed.dosage}) Skipped`,
        description: `Marked as skipped by ${actorName} at ${nowTime}. Reason: "${skipReason}". Caregiver notified for routine review.`,
        author: {
          name: actorName,
          role: actorRole,
        },
        severity: 'attention',
      });
    }
  };

  // 3. Record Dose Snoozed (Elderly Interaction)
  const recordDoseSnoozed = (
    id: string,
    minutes = 15,
    actor?: { name: string; role: string }
  ) => {
    if (!isDemoMode) {
      const snoozeUntil = new Date(Date.now() + minutes * 60000).toISOString();
      recordLiveDose(id, 'snoozed', `Snoozed for ${minutes} minutes`, snoozeUntil);
      return;
    }
    const actorName = actor?.name || 'Eleanor Vance';
    const actorRole = actor?.role || 'Care Recipient';
    const now = new Date();
    const snoozeDate = new Date(now.getTime() + minutes * 60000);
    const snoozeTimeString = snoozeDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const nowTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMedications((prev) =>
      prev.map((med) => {
        if (med.id === id) {
          return {
            ...med,
            status: 'snoozed',
            snoozedUntil: snoozeTimeString,
            lastActionBy: actorName,
            lastActionAt: nowTime,
          };
        }
        return med;
      })
    );

    const targetMed = medications.find((m) => m.id === id);
    if (targetMed) {
      addTimelineEvent({
        timestamp: `${nowTime} today`,
        type: 'medication',
        title: `⏰ ${targetMed.name} Snoozed for ${minutes} Minutes`,
        description: `${actorName} requested a gentle reminder snooze until ${snoozeTimeString}.`,
        author: {
          name: actorName,
          role: actorRole,
        },
        severity: 'normal',
      });
    }
  };

  // 4. Record Need Help (Elderly Interaction)
  const recordDoseNeedHelp = (
    id: string,
    details?: string,
    actor?: { name: string; role: string }
  ) => {
    const helpDetails = details || 'Care recipient requested assistance with medication';
    if (!isDemoMode) {
      recordLiveDose(id, 'help_requested', helpDetails);
      return;
    }
    const actorName = actor?.name || 'Eleanor Vance';
    const actorRole = actor?.role || 'Care Recipient';
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const targetMed = medications.find((m) => m.id === id);
    const medName = targetMed?.name || 'Medication';
    const medDosage = targetMed?.dosage || '';
    const medSchedule = targetMed?.scheduleTime || nowTime;

    // Check if task already exists to prevent duplicate creation
    let existingTask = followUpTasks.find(
      (t) => t.medicationId === id && t.status !== 'resolved'
    );

    if (!existingTask) {
      const newTask: FollowUpTask = {
        id: `task-help-${Date.now()}`,
        medicationId: id,
        medicationName: medName,
        dosage: medDosage,
        scheduledTime: medSchedule,
        elderlyName: 'Eleanor Vance',
        elderlyId: 'usr-senior-1',
        followUpReason: `Senior requested help: "${helpDetails}"`,
        assignedCaregiverId: 'circ-1',
        assignedCaregiverName: 'Sarah Vance',
        status: 'pending',
        createdAt: nowTime,
      };

      setFollowUpTasks((prev) => [newTask, ...prev]);
      existingTask = newTask;

    }

    addTimelineEvent({
      timestamp: `${nowTime} today`,
      type: 'alert',
      title: `🚨 Help Requested for ${medName}`,
      description: `${actorName} tapped "Need Help" for ${medName} (${medDosage}). Follow-up task assigned to Sarah Vance immediately. Note: "${helpDetails}".`,
      author: {
        name: actorName,
        role: actorRole,
      },
      severity: 'critical',
    });
  };

  // 5. Unconfirmed Dose Detection & Simulation
  const simulateUnconfirmedDose = (medicationId?: string): FollowUpTask | null => {
    if (!isDemoMode) return null;
    const target = medicationId
      ? medications.find((m) => m.id === medicationId)
      : medications.find((m) => m.status === 'scheduled' || m.status === 'snoozed') ||
        medications[0];

    if (!target) return null;

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Change status to unconfirmed
    setMedications((prev) =>
      prev.map((m) => (m.id === target.id ? { ...m, status: 'unconfirmed' } : m))
    );

    // 2. Prevent duplicate task creation
    const existingTask = followUpTasks.find(
      (t) => t.medicationId === target.id && t.status !== 'resolved'
    );

    if (existingTask) {
      addTimelineEvent({
        timestamp: `${nowTime} today`,
        type: 'alert',
        title: `Follow-up already active for ${target.name}`,
        description: `Unconfirmed follow-up task is already assigned to ${existingTask.assignedCaregiverName}. Duplicate task suppressed.`,
        author: {
          name: 'CareLoop Monitor',
          role: 'System',
        },
        severity: 'attention',
      });
      return existingTask;
    }

    // 3. Create follow-up task assigned to primary caregiver
    const primaryCaregiver = careCircle.find((c) => c.isPrimaryContact) || careCircle[0];

    const newTask: FollowUpTask = {
      id: `task-${Date.now()}`,
      medicationId: target.id,
      medicationName: target.name,
      dosage: target.dosage,
      scheduledTime: target.scheduleTime,
      elderlyName: 'Eleanor Vance',
      elderlyId: 'usr-senior-1',
      followUpReason: `Scheduled dose at ${target.scheduleTime} unconfirmed past 45-minute grace period`,
      assignedCaregiverId: primaryCaregiver.id,
      assignedCaregiverName: primaryCaregiver.name,
      status: 'pending',
      createdAt: nowTime,
    };

    setFollowUpTasks((prev) => [newTask, ...prev]);

    // 4. Log alert to timeline
    addTimelineEvent({
      timestamp: `${nowTime} today`,
      type: 'alert',
      title: `⚠️ Unconfirmed Dose Detected: ${target.name}`,
      description: `${target.name} (${target.dosage}) remained unconfirmed beyond the grace period. Follow-up task automatically assigned to ${primaryCaregiver.name}.`,
      author: {
        name: 'CareLoop Monitor',
        role: 'Automated Safety Detection',
      },
      severity: 'attention',
    });

    return newTask;
  };

  const detectUnconfirmedDoses = (): FollowUpTask[] => {
    if (!isDemoMode) return [];
    const createdTasks: FollowUpTask[] = [];
    const unconfirmedMeds = medications.filter(
      (m) => m.status === 'scheduled' || m.status === 'unconfirmed'
    );

    unconfirmedMeds.forEach((med) => {
      const alreadyHasTask = followUpTasks.some(
        (task) => task.medicationId === med.id && task.status !== 'resolved'
      );
      if (!alreadyHasTask) {
        const task = simulateUnconfirmedDose(med.id);
        if (task) createdTasks.push(task);
      }
    });

    return createdTasks;
  };

  const detectUnconfirmedDosesRef = useRef(detectUnconfirmedDoses);
  detectUnconfirmedDosesRef.current = detectUnconfirmedDoses;

  useEffect(() => {
    if (!isDemoMode) return;
    const ticker = setInterval(() => {
      detectUnconfirmedDosesRef.current();
    }, 60000);

    return () => clearInterval(ticker);
  }, [isDemoMode]);

  // 6. Caregiver Acknowledgement ("I'll check on them")
  const acknowledgeFollowUpTask = (
    taskId: string,
    caregiver: { id: string; name: string }
  ) => {
    if (!isDemoMode) {
      runLiveMutation(() => supabaseCareLoop.acknowledgeFollowUpTask(taskId));
      return;
    }
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setFollowUpTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            status: 'acknowledged',
            acknowledgedAt: nowTime,
            acknowledgedBy: caregiver.name,
          };
        }
        return task;
      })
    );

    const task = followUpTasks.find((t) => t.id === taskId);
    if (task) {
      addTimelineEvent({
        timestamp: `${nowTime} today`,
        type: 'note',
        title: `Caregiver Acknowledged: ${caregiver.name}`,
        description: `${caregiver.name} selected "I'll check on them" for ${task.medicationName} (${task.scheduledTime}). Medication remains unconfirmed pending verification.`,
        author: {
          name: caregiver.name,
          role: 'Primary Caregiver',
        },
        severity: 'normal',
      });
    }
  };

  // 7. Escalation to Backup / Secondary Caregiver
  const escalateFollowUpTask = (taskId: string, force = true) => {
    if (!isDemoMode) {
      runLiveMutation(() => supabaseCareLoop.escalateFollowUpTask(taskId));
      return;
    }
    const task = followUpTasks.find((t) => t.id === taskId);
    if (!task || task.status === 'resolved') return;

    // Prevent repeated duplicate escalation alerts if already escalated
    if (!force && task.status === 'escalated') {
      return;
    }

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Escalation target: Nurse Maria Gomez (circ-3) or David Vance (circ-2)
    const backupCaregiver =
      careCircle.find((c) => c.id === 'circ-3') ||
      careCircle.find((c) => c.id === 'circ-2') ||
      careCircle[1];

    setFollowUpTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status: 'escalated',
            escalatedAt: nowTime,
            escalatedToCaregiverId: backupCaregiver.id,
            escalatedToCaregiverName: backupCaregiver.name,
            escalationCount: (t.escalationCount || 0) + 1,
          };
        }
        return t;
      })
    );

    addTimelineEvent({
      timestamp: `${nowTime} today`,
      type: 'alert',
      title: `🚨 Escalation Notice: Follow-Up Re-Assigned to ${backupCaregiver.name}`,
      description: `Follow-up for ${task.medicationName} (${task.dosage}) was not resolved within the escalation window. Alert escalated to secondary caregiver ${backupCaregiver.name} (${backupCaregiver.role}).`,
      author: {
        name: 'CareLoop Escalation Engine',
        role: 'Automated Dispatch',
      },
      severity: 'critical',
    });
  };

  // 8. Follow-Up Resolution (Caregiver Records Actual Outcome)
  const resolveFollowUpTask = (
    taskId: string,
    resolution: { type: FollowUpResolutionType; label: string; notes?: string },
    caregiver: { name: string; role: string }
  ) => {
    if (!isDemoMode) {
      runLiveMutation(() =>
        supabaseCareLoop.resolveFollowUpTask(taskId, resolution.type, resolution.notes)
      );
      return;
    }
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const targetTask = followUpTasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    // 1. Update task status to resolved, separate from dose status
    setFollowUpTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status: 'resolved',
            resolvedAt: nowTime,
            resolvedBy: caregiver.name,
            resolution: {
              ...resolution,
              resolvedAt: nowTime,
              resolvedBy: caregiver.name,
              resolvedByRole: caregiver.role,
            },
            notes: resolution.notes,
          };
        }
        return t;
      })
    );

    // 2. Update dose status based on the specific resolution
    if (resolution.type === 'dose_taken') {
      setMedications((prev) =>
        prev.map((m) =>
          m.id === targetTask.medicationId
            ? {
                ...m,
                status: 'taken',
                takenAt: `${nowTime} (verified by ${caregiver.name})`,
                lastActionBy: caregiver.name,
                lastActionAt: nowTime,
              }
            : m
        )
      );
    } else if (resolution.type === 'dose_skipped') {
      setMedications((prev) =>
        prev.map((m) =>
          m.id === targetTask.medicationId
            ? {
                ...m,
                status: 'skipped',
                skippedReason: resolution.notes || 'Caregiver marked dose as skipped',
                lastActionBy: caregiver.name,
                lastActionAt: nowTime,
              }
            : m
        )
      );
    }

    // 3. Update timeline with outcome
    addTimelineEvent({
      timestamp: `${nowTime} today`,
      type: resolution.type === 'dose_taken' ? 'medication' : 'note',
      title: `Follow-Up Resolved: ${resolution.label}`,
      description: `${caregiver.name} resolved follow-up for ${targetTask.medicationName}. Outcome: ${resolution.label}. Notes: "${resolution.notes || 'No extra notes provided'}".`,
      author: {
        name: caregiver.name,
        role: caregiver.role,
      },
      severity: resolution.type === 'dose_taken' ? 'normal' : 'attention',
    });
  };

  const toggleCareLoopItem = (id: string) => {
    if (!isDemoMode) {
      setPersistenceError('Care routine persistence is not available in the connected workflow yet.');
      return;
    }
    setCareLoop((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const willComplete = !item.completed;
          return {
            ...item,
            completed: willComplete,
            completedAt: willComplete
              ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : undefined,
            completedBy: willComplete ? 'Current User' : undefined,
          };
        }
        return item;
      })
    );
  };

  const triggerEmergencyAlert = () => {
    if (!isDemoMode) {
      setPersistenceError('Emergency notifications are not configured. Contact local emergency services directly.');
      return;
    }
    setEmergencyAlertActive(true);
    addTimelineEvent({
      timestamp: 'Immediate',
      type: 'alert',
      title: '🚨 SOS Emergency Alert Triggered',
      description: 'Emergency button activated. Sarah Vance (Primary Caregiver) and St. Jude On-Call Nurse notified immediately.',
      author: {
        name: 'Eleanor Vance',
        role: 'SOS System',
      },
      severity: 'critical',
    });
  };

  const dismissEmergencyAlert = () => {
    setEmergencyAlertActive(false);
  };

  const addAppointment = (appt: Omit<Appointment, 'id'>) => {
    if (!isDemoMode) {
      if (!activeElderId) {
        setPersistenceError('No accessible elder profile is linked to this account.');
        return;
      }
      runLiveMutation(async () => {
        await supabaseCareLoop.createAppointment(activeElderId, appt);
        await supabaseCareLoop.recordCareActivity({
          elderId: activeElderId,
          type: 'appointment',
          title: `New Appointment: ${appt.doctorName}`,
          description: `Scheduled for ${appt.date} at ${appt.time} (${appt.specialty}).`,
        });
      });
      return;
    }
    const newAppt: Appointment = {
      ...appt,
      id: `appt-${Date.now()}`,
    };
    setAppointments((prev) => [newAppt, ...prev]);
    addTimelineEvent({
      timestamp: 'Just now',
      type: 'appointment',
      title: `New Appointment: ${appt.doctorName}`,
      description: `Scheduled for ${appt.date} at ${appt.time} (${appt.specialty}).`,
      author: {
        name: 'Care Coordinator',
        role: 'Schedule Sync',
      },
      severity: 'normal',
    });
  };

  const resetDemoData = () => {
    if (!isDemoMode) return;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.warn(e);
      }
    }
    setMedications(INITIAL_MEDICATIONS);
    setCareLoop(INITIAL_CARE_LOOP);
    setAppointments(INITIAL_APPOINTMENTS);
    setTimeline(INITIAL_TIMELINE);
    setFollowUpTasks([]);
    setEmergencyAlertActive(false);
  };

  return (
    <CareContext.Provider
      value={{
        medications,
        careLoop,
        careCircle,
        voiceSessions,
        voiceProfiles,
        appointments,
        timeline,
        followUpTasks,
        emergencyAlertActive,
        activeVoiceAssistant,
        isDemoMode,
        isLoading,
        persistenceError,
        clearPersistenceError: () => setPersistenceError(null),
        activeElderId,
        elderlyName,
        refreshCareData: loadLiveCare,
        createCareInvite: async (role, relationship, phone, canManageMeds = false) => {
          if (isDemoMode) throw new Error('Invitations are unavailable in Demo Mode.');
          if (!activeElderId) throw new Error('No elder profile is available for this account.');
          return supabaseCareLoop.createCareInvite(
            activeElderId,
            role,
            relationship,
            phone,
            canManageMeds
          );
        },
        acceptCareInvite: async (code) => {
          if (isDemoMode) throw new Error('Invitations are unavailable in Demo Mode.');
          await supabaseCareLoop.acceptCareInvite(code);
          await loadLiveCare();
        },
        recordDoseTaken,
        recordDoseSkipped,
        recordDoseSnoozed,
        recordDoseNeedHelp,
        markMedicationTaken,
        simulateUnconfirmedDose,
        detectUnconfirmedDoses,
        acknowledgeFollowUpTask,
        escalateFollowUpTask,
        resolveFollowUpTask,
        toggleCareLoopItem,
        addTimelineEvent,
        triggerEmergencyAlert,
        dismissEmergencyAlert,
        addAppointment,
        setActiveVoiceAssistant,
        resetDemoData,
      }}
    >
      {children}
    </CareContext.Provider>
  );
};

export const useCare = (): CareContextType => {
  const context = useContext(CareContext);
  if (!context) {
    throw new Error('useCare must be used within a CareProvider');
  }
  return context;
};
