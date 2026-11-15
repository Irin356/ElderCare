import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  CareCircleMember,
  Appointment,
  FollowUpResolutionType,
  FollowUpTask,
  FollowUpTaskStatus,
  Medication,
  TimelineEvent,
  UserRole,
} from '../types';

interface ElderRow {
  id: string;
  user_id: string | null;
  full_name: string;
}

interface MedicationRow {
  id: string;
  elder_id: string;
  name: string;
  dosage: string;
  instructions: string | null;
  pill_color: string;
  shape: Medication['shape'];
  prescribed_by: string | null;
  is_active: boolean;
}

interface ScheduleRow {
  id: string;
  medication_id: string;
  schedule_time: string;
  is_active: boolean;
}

interface DoseEventRow {
  id: string;
  medication_id: string;
  scheduled_for: string;
  status: string;
  recorded_at: string;
  recorded_by_name: string;
  notes: string | null;
  snooze_until: string | null;
}

interface TaskRow {
  id: string;
  elder_id: string;
  medication_id: string;
  schedule_id: string | null;
  scheduled_for: string | null;
  assigned_caregiver_id: string;
  reason: string;
  status: FollowUpTaskStatus;
  created_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_type: FollowUpResolutionType | null;
  resolution_notes: string | null;
  escalation_count: number;
}

interface ProfileRow {
  id: string;
  full_name: string;
  role: string;
  phone: string | null;
}

interface MembershipRow {
  id: string;
  user_id: string;
  role: string;
  relationship: string;
  can_manage_meds: boolean;
  can_acknowledge_tasks: boolean;
  escalation_priority: number;
  status: string;
}

interface ActivityRow {
  id: string;
  type: TimelineEvent['type'];
  title: string;
  description: string;
  severity: TimelineEvent['severity'];
  author_name: string;
  author_role: string;
  created_at: string;
}

interface AppointmentRow {
  id: string;
  doctor_name: string | null;
  specialty: string | null;
  clinic: string | null;
  appointment_date: string;
  appointment_time: string;
  type: Appointment['type'];
  status: Appointment['status'];
  notes: string | null;
  phone: string | null;
}

export interface CareLoopSnapshot {
  elderId: string | null;
  elderlyName: string | null;
  medications: Medication[];
  followUpTasks: FollowUpTask[];
  timeline: TimelineEvent[];
  careCircle: CareCircleMember[];
  appointments: Appointment[];
}

const failIfError = (error: { message: string } | null, operation: string) => {
  if (error) throw new Error(`${operation}: ${error.message}`);
};

const formatTime = (time: string) => {
  const [hoursText, minutesText] = time.split(':');
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return time;
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const occurrenceForToday = (time: string) => {
  const match = /^\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?\s*$/i.exec(time);
  if (!match) {
    throw new Error('Medication schedule has an invalid time.');
  }
  const [, hoursText, minutesText, secondsText = '0', meridiem] = match;
  let hours = Number(hoursText);
  const minutes = Number(minutesText);
  const seconds = Number(secondsText);
  if (meridiem) {
    if (hours < 1 || hours > 12) throw new Error('Medication schedule has an invalid time.');
    hours = (hours % 12) + (meridiem.toUpperCase() === 'PM' ? 12 : 0);
  }
  if (hours > 23 || minutes > 59 || seconds > 59) {
    throw new Error('Medication schedule has an invalid time.');
  }
  const occurrence = new Date();
  occurrence.setHours(hours, minutes, seconds, 0);
  return occurrence.toISOString();
};

const relativeTime = (timestamp: string) => {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000));
  if (elapsedMinutes < 1) return 'Just now';
  if (elapsedMinutes < 60) return `${elapsedMinutes} min ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} hr ago`;
  return `${Math.floor(elapsedHours / 24)} day ago`;
};

const toSqlTime = (time: string) => {
  const match = /^\s*(\d{1,2}):(\d{2})\s*(AM|PM)?\s*$/i.exec(time);
  if (!match) throw new Error('Appointment time has an invalid format.');
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (match[3]) {
    if (hours < 1 || hours > 12) throw new Error('Appointment time has an invalid format.');
    hours = (hours % 12) + (match[3].toUpperCase() === 'PM' ? 12 : 0);
  }
  if (hours > 23 || minutes > 59) throw new Error('Appointment time has an invalid format.');
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
};

const statusForEvent = (status: string): Medication['status'] => {
  if (status === 'taken' || status === 'skipped' || status === 'snoozed') return status;
  if (status === 'unconfirmed' || status === 'help_requested') return 'unconfirmed';
  return 'scheduled';
};

export const supabaseCareLoop = {
  isConfigured: isSupabaseConfigured,

  async loadCareLoop(userId: string, userRole: UserRole): Promise<CareLoopSnapshot> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const elderResult = await supabase
      .from('elder_profiles')
      .select('id, user_id, full_name')
      .order('created_at', { ascending: true });
    failIfError(elderResult.error, 'Failed to load accessible elder profiles');

    let elders = (elderResult.data || []) as ElderRow[];
    if (elders.length === 0 && userRole === 'elderly') {
      const ensureResult = await supabase.rpc('ensure_own_elder_profile', {
        p_full_name: undefined,
        p_timezone_name: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      });
      failIfError(ensureResult.error, 'Failed to initialize your elder profile');
      const createdId = ensureResult.data as string;
      const createdProfile = await supabase
        .from('elder_profiles')
        .select('id, user_id, full_name')
        .eq('id', createdId)
        .single();
      failIfError(createdProfile.error, 'Failed to load your elder profile');
      elders = [createdProfile.data as ElderRow];
    }

    const elder = elders.find((item) => item.user_id === userId) || elders[0];
    if (!elder) {
      return {
        elderId: null,
        elderlyName: null,
        medications: [],
        followUpTasks: [],
        timeline: [],
        careCircle: [],
        appointments: [],
      };
    }

    const [
      medicationResult,
      scheduleResult,
      eventResult,
      taskResult,
      activityResult,
      memberResult,
      appointmentResult,
    ] =
      await Promise.all([
        supabase.from('medications').select('*').eq('elder_id', elder.id).eq('is_active', true),
        supabase.from('dose_schedules').select('*').eq('is_active', true),
        supabase
          .from('dose_events')
          .select('*')
          .eq('elder_id', elder.id)
          .gte('scheduled_for', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
          .order('recorded_at', { ascending: false }),
        supabase
          .from('follow_up_tasks')
          .select('*')
          .eq('elder_id', elder.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('care_activity')
          .select('*')
          .eq('elder_id', elder.id)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('care_memberships')
          .select('id, user_id, role, relationship, can_manage_meds, can_acknowledge_tasks, escalation_priority, status')
          .eq('elder_id', elder.id)
          .eq('status', 'active'),
        supabase
          .from('appointments')
          .select('id, doctor_name, specialty, clinic, appointment_date, appointment_time, type, status, notes, phone')
          .eq('elder_id', elder.id)
          .order('appointment_date', { ascending: true }),
      ]);

    failIfError(medicationResult.error, 'Failed to load medications');
    failIfError(scheduleResult.error, 'Failed to load dose schedules');
    failIfError(eventResult.error, 'Failed to load dose events');
    failIfError(taskResult.error, 'Failed to load follow-up tasks');
    failIfError(activityResult.error, 'Failed to load care timeline');
    failIfError(memberResult.error, 'Failed to load care memberships');
    failIfError(appointmentResult.error, 'Failed to load appointments');

    const medications = (medicationResult.data || []) as MedicationRow[];
    const schedules = (scheduleResult.data || []) as ScheduleRow[];
    const events = (eventResult.data || []) as DoseEventRow[];
    const tasks = (taskResult.data || []) as TaskRow[];
    const activities = (activityResult.data || []) as ActivityRow[];
    const memberships = (memberResult.data || []) as MembershipRow[];
    const appointmentRows = (appointmentResult.data || []) as AppointmentRow[];
    const memberIds = [...new Set([userId, ...memberships.map((member) => member.user_id)])];

    const profileResult =
      memberIds.length > 0
        ? await supabase.from('profiles').select('id, full_name, role, phone').in('id', memberIds)
        : { data: [], error: null };
    failIfError(profileResult.error, 'Failed to load care team profiles');
    const profiles = (profileResult.data || []) as ProfileRow[];
    const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
    const schedulesByMedication = new Map<string, ScheduleRow[]>();
    schedules.forEach((schedule) => {
      const values = schedulesByMedication.get(schedule.medication_id) || [];
      values.push(schedule);
      schedulesByMedication.set(schedule.medication_id, values);
    });
    const latestEventByMedication = new Map<string, DoseEventRow>();
    events.forEach((event) => {
      if (!latestEventByMedication.has(event.medication_id)) {
        latestEventByMedication.set(event.medication_id, event);
      }
    });

    const visibleMedications: Medication[] = medications.map((medication) => {
        const schedule = schedulesByMedication.get(medication.id)?.[0];
        const event = latestEventByMedication.get(medication.id);
        return {
          id: medication.id,
          name: medication.name,
          dosage: medication.dosage,
          scheduleTime: schedule ? formatTime(schedule.schedule_time) : '',
          instructions: medication.instructions || '',
          pillColor: medication.pill_color,
          shape: medication.shape,
          status: event ? statusForEvent(event.status) : 'scheduled',
          takenAt: event?.status === 'taken' ? new Date(event.recorded_at).toLocaleTimeString() : undefined,
          snoozedUntil: event?.snooze_until
            ? new Date(event.snooze_until).toLocaleTimeString()
            : undefined,
          skippedReason: event?.status === 'skipped' ? event.notes || undefined : undefined,
          lastActionBy: event?.recorded_by_name,
          lastActionAt: event ? new Date(event.recorded_at).toLocaleTimeString() : undefined,
          prescribedBy: medication.prescribed_by || '',
        };
      });
    const medicationsById = new Map(visibleMedications.map((medication) => [medication.id, medication]));
    const followUpTasks: FollowUpTask[] = tasks.map((task) => {
      const medication = medicationsById.get(task.medication_id);
      const caregiver = profilesById.get(task.assigned_caregiver_id);
      const acknowledgedBy = task.acknowledged_by
        ? profilesById.get(task.acknowledged_by)
        : undefined;
      const resolvedBy = task.resolved_by ? profilesById.get(task.resolved_by) : undefined;
      const scheduledTime = task.scheduled_for
        ? new Date(task.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : medication?.scheduleTime || '';
      return {
        id: task.id,
        medicationId: task.medication_id,
        medicationName: medication?.name || 'Medication',
        dosage: medication?.dosage || '',
        scheduledTime,
        elderlyName: elder.full_name,
        elderlyId: elder.id,
        followUpReason: task.reason,
        assignedCaregiverId: task.assigned_caregiver_id,
        assignedCaregiverName: caregiver?.full_name || 'Care team member',
        status: task.status,
        createdAt: task.created_at,
        acknowledgedAt: task.acknowledged_at || undefined,
        acknowledgedBy: acknowledgedBy?.full_name,
        escalationCount: task.escalation_count,
        resolution:
          task.resolution_type && task.resolved_at
            ? {
                type: task.resolution_type,
                label: task.resolution_type.replace(/_/g, ' '),
                notes: task.resolution_notes || undefined,
                resolvedAt: task.resolved_at,
                resolvedBy: resolvedBy?.full_name || '',
                resolvedByRole: resolvedBy?.role || '',
              }
            : undefined,
        resolvedAt: task.resolved_at || undefined,
        resolvedBy: resolvedBy?.full_name,
        notes: task.resolution_notes || undefined,
      };
    });

    const careCircle: CareCircleMember[] = memberships.map((member) => {
      const profile = profilesById.get(member.user_id);
      return {
        id: member.user_id,
        name: profile?.full_name || 'Care team member',
        role: member.role,
        relation: member.relationship,
        avatar: '',
        phone: profile?.phone || '',
        isOnline: false,
        isPrimaryContact: member.role === 'primary_caregiver',
        canManageMeds: member.can_manage_meds,
        lastActive: 'Member',
      };
    });

    const timeline: TimelineEvent[] = activities.map((activity) => ({
      id: activity.id,
      timestamp: new Date(activity.created_at).toLocaleString(),
      timeAgo: relativeTime(activity.created_at),
      type: activity.type,
      title: activity.title,
      description: activity.description,
      author: { name: activity.author_name, role: activity.author_role },
      severity: activity.severity || 'normal',
    }));
    const appointments: Appointment[] = appointmentRows.map((appointment) => ({
      id: appointment.id,
      doctorName: typeof appointment.doctor_name === 'string' ? appointment.doctor_name.trim() : '',
      specialty: appointment.specialty || '',
      clinic: appointment.clinic || '',
      date: appointment.appointment_date,
      time: formatTime(appointment.appointment_time),
      type: appointment.type,
      status: appointment.status,
      notes: appointment.notes || '',
      phone: appointment.phone || '',
    }));

    return {
      elderId: elder.id,
      elderlyName: elder.full_name,
      medications: visibleMedications,
      followUpTasks,
      timeline,
      careCircle,
      appointments,
    };
  },

  async recordDoseEvent(event: {
    medicationId: string;
    status: 'taken' | 'skipped' | 'snoozed' | 'help_requested';
    scheduledFor: string;
    recordedByName?: string;
    confirmedByType?: 'self' | 'caregiver';
    notes?: string;
    snoozeUntil?: string;
    idempotencyKey?: string;
  }) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.rpc('record_dose_event', {
      p_medication_id: event.medicationId,
      p_status: event.status,
      p_scheduled_for: event.scheduledFor,
      p_notes: event.notes || null,
      p_snooze_until: event.snoozeUntil || null,
      p_idempotency_key: event.idempotencyKey || crypto.randomUUID(),
    });
    failIfError(error, 'Failed to record dose event');
    return data as string;
  },

  async acknowledgeFollowUpTask(taskId: string) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.rpc('acknowledge_follow_up_task', {
      p_task_id: taskId,
    });
    failIfError(error, 'Failed to acknowledge follow-up task');
    return data as string;
  },

  async escalateFollowUpTask(taskId: string) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.rpc('escalate_follow_up_task', {
      p_task_id: taskId,
    });
    failIfError(error, 'Failed to escalate follow-up task');
    return data as boolean;
  },

  async resolveFollowUpTask(taskId: string, type: FollowUpResolutionType, notes?: string) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.rpc('resolve_follow_up_task', {
      p_task_id: taskId,
      p_resolution_type: type,
      p_notes: notes || null,
    });
    failIfError(error, 'Failed to resolve follow-up task');
    return data as string;
  },

  async recordCareActivity(activity: {
    elderId: string;
    type: TimelineEvent['type'];
    title: string;
    description: string;
    severity?: TimelineEvent['severity'];
  }) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.rpc('append_care_activity', {
      p_elder_id: activity.elderId,
      p_type: activity.type,
      p_title: activity.title,
      p_description: activity.description,
      p_severity: activity.severity || 'normal',
    });
    failIfError(error, 'Failed to record care timeline activity');
    return data as string;
  },

  async createAppointment(elderId: string, appointment: Omit<Appointment, 'id'>) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        elder_id: elderId,
        doctor_name: appointment.doctorName,
        specialty: appointment.specialty || null,
        clinic: appointment.clinic || null,
        appointment_date: appointment.date,
        appointment_time: toSqlTime(appointment.time),
        type: appointment.type,
        status: appointment.status,
        notes: appointment.notes || null,
        phone: appointment.phone || null,
      })
      .select('id')
      .single();
    failIfError(error, 'Failed to create appointment');
    if (!data) throw new Error('Failed to create appointment: no record was returned.');
    return data.id as string;
  },

  async createCareInvite(
    elderId: string,
    role: string,
    relationship: string,
    phone?: string,
    canManageMeds = false
  ) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.rpc('create_care_invite', {
      p_elder_id: elderId,
      p_role: role,
      p_relationship: relationship,
      p_phone: phone || null,
      p_can_manage_meds: canManageMeds,
    });
    failIfError(error, 'Failed to create care invitation');
    return data as string;
  },

  async acceptCareInvite(code: string) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.rpc('accept_care_invite', {
      p_invite_code: code,
    });
    failIfError(error, 'Failed to accept care invitation');
    return data as string;
  },

  subscribeToCareLoopUpdates(
    elderId: string,
    onUpdate: () => void,
    onError?: (error: Error) => void
  ) {
    if (!isSupabaseConfigured) {
      return { unsubscribe: () => undefined };
    }
    if (!elderId) throw new Error('An elder profile is required for realtime updates.');

    const channel = supabase
      .channel(`careloop:${elderId}:${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dose_events', filter: `elder_id=eq.${elderId}` },
        onUpdate
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'follow_up_tasks', filter: `elder_id=eq.${elderId}` },
        onUpdate
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'care_activity', filter: `elder_id=eq.${elderId}` },
        onUpdate
      )
      .subscribe((status, error) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          onError?.(new Error(error?.message || `Realtime channel status: ${status}`));
        }
      });

    return { unsubscribe: () => void supabase.removeChannel(channel) };
  },
};

export const careLoopFormatting = { formatTime, occurrenceForToday };
