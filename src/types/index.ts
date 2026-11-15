export type UserRole = 'elderly' | 'caregiver' | 'family' | 'doctor';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  relationship?: string;
  phone?: string;
  emergencyContact?: boolean;
}

export type MedicationStatus = 'scheduled' | 'taken' | 'missed' | 'skipped' | 'unconfirmed' | 'snoozed';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  scheduleTime: string; // e.g. "08:00 AM"
  instructions: string;
  pillColor: string;
  shape: 'round' | 'capsule' | 'oval';
  status: MedicationStatus;
  takenAt?: string;
  snoozedUntil?: string;
  skippedReason?: string;
  lastActionBy?: string;
  lastActionAt?: string;
  prescribedBy: string;
}

export type FollowUpTaskStatus = 'pending' | 'acknowledged' | 'in_progress' | 'escalated' | 'resolved';

export type FollowUpResolutionType =
  | 'dose_taken'
  | 'dose_skipped'
  | 'help_required'
  | 'medicine_unavailable'
  | 'unable_to_contact'
  | 'further_assistance_required';

export interface FollowUpResolution {
  type: FollowUpResolutionType;
  label: string;
  notes?: string;
  resolvedAt: string;
  resolvedBy: string;
  resolvedByRole: string;
}

export interface FollowUpTask {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  elderlyName: string;
  elderlyId: string;
  followUpReason: string;
  assignedCaregiverId: string;
  assignedCaregiverName: string;
  status: FollowUpTaskStatus;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  escalatedAt?: string;
  escalatedToCaregiverId?: string;
  escalatedToCaregiverName?: string;
  escalationCount?: number;
  resolution?: FollowUpResolution;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
}

export type CareLoopPriority = 'routine' | 'important' | 'urgent';

export interface CareLoopItem {
  id: string;
  title: string;
  description: string;
  category: 'hydration' | 'vitals' | 'activity' | 'medication' | 'mood' | 'nutrition';
  dueTime: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  priority: CareLoopPriority;
}

export interface CareCircleMember {
  id: string;
  name: string;
  role: string;
  relation: string;
  avatar: string;
  phone: string;
  isOnline: boolean;
  isPrimaryContact: boolean;
  canManageMeds: boolean;
  location?: string;
  lastActive: string;
}

export interface VoiceCareSession {
  id: string;
  date: string;
  time: string;
  durationSeconds: number;
  moodDetected: 'cheerful' | 'calm' | 'anxious' | 'tired' | 'confused';
  summary: string;
  topicsDiscussed: string[];
  alertsTriggered: string[];
}

export interface VoiceProfile {
  id: string;
  name: string;
  relation: string;
  sampleCount: number;
  status: 'ready' | 'training' | 'needs_samples';
  description: string;
  previewUrl?: string;
  avatar: string;
  lastTrained?: string;
}

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  clinic: string;
  date: string;
  time: string;
  type: 'in-person' | 'video' | 'home-visit';
  status: 'upcoming' | 'completed' | 'cancelled';
  notes: string;
  phone: string;
  companionAssigned?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  timeAgo: string;
  type: 'medication' | 'vitals' | 'voice' | 'alert' | 'note' | 'appointment' | 'activity';
  title: string;
  description: string;
  author: {
    name: string;
    role: string;
    avatar?: string;
  };
  severity?: 'normal' | 'attention' | 'critical';
}
