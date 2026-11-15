-- ====================================================================
-- ElderCare 360 Core Database Schema Migration
-- Migration: 20261115000000_eldercare_core_schema.sql
-- ====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------------------
-- 1. Profiles Table (Extends Supabase auth.users)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('elderly', 'caregiver', 'family', 'doctor', 'admin')),
  avatar_url TEXT,
  phone TEXT,
  relationship TEXT,
  emergency_contact BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for role-based lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- --------------------------------------------------------------------
-- 2. Elder Profiles Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.elder_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  address TEXT,
  emergency_notes TEXT,
  primary_caregiver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_elder_profiles_user_id ON public.elder_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_elder_profiles_primary_caregiver ON public.elder_profiles(primary_caregiver_id);

-- --------------------------------------------------------------------
-- 3. Care Memberships (CareCircle Roster & Access Controls)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.care_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id UUID NOT NULL REFERENCES public.elder_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('primary_caregiver', 'family_member', 'visiting_nurse', 'doctor', 'emergency_contact')),
  relationship TEXT NOT NULL,
  can_manage_meds BOOLEAN NOT NULL DEFAULT false,
  can_acknowledge_tasks BOOLEAN NOT NULL DEFAULT true,
  escalation_priority INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_care_member_elder UNIQUE (elder_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_care_memberships_elder ON public.care_memberships(elder_id);
CREATE INDEX IF NOT EXISTS idx_care_memberships_user ON public.care_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_care_memberships_status ON public.care_memberships(status);

-- --------------------------------------------------------------------
-- 4. Care Invites Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.care_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id UUID NOT NULL REFERENCES public.elder_profiles(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'family_member',
  relationship TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_care_invites_code ON public.care_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_care_invites_elder ON public.care_invites(elder_id);

-- --------------------------------------------------------------------
-- 5. Medications Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id UUID NOT NULL REFERENCES public.elder_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  instructions TEXT,
  pill_color TEXT NOT NULL DEFAULT '#0D9488',
  shape TEXT NOT NULL DEFAULT 'round' CHECK (shape IN ('round', 'capsule', 'oval')),
  prescribed_by TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medications_elder ON public.medications(elder_id);

-- --------------------------------------------------------------------
-- 6. Dose Schedules Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dose_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  schedule_time TIME NOT NULL,
  days_of_week INT[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
  grace_period_minutes INT NOT NULL DEFAULT 45,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dose_schedules_med ON public.dose_schedules(medication_id);

-- --------------------------------------------------------------------
-- 7. Dose Events Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dose_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.dose_schedules(id) ON DELETE SET NULL,
  elder_id UUID NOT NULL REFERENCES public.elder_profiles(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('taken', 'skipped', 'snoozed', 'unconfirmed', 'help_requested')),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recorded_by_name TEXT NOT NULL,
  confirmed_by_type TEXT NOT NULL CHECK (confirmed_by_type IN ('self', 'caregiver', 'system')),
  snooze_until TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dose_events_elder ON public.dose_events(elder_id);
CREATE INDEX IF NOT EXISTS idx_dose_events_med ON public.dose_events(medication_id);
CREATE INDEX IF NOT EXISTS idx_dose_events_status ON public.dose_events(status);

-- --------------------------------------------------------------------
-- 8. Follow-Up Tasks Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.follow_up_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id UUID NOT NULL REFERENCES public.elder_profiles(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.dose_schedules(id) ON DELETE SET NULL,
  assigned_caregiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'in_progress', 'escalated', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution_type TEXT CHECK (resolution_type IN ('dose_taken', 'dose_skipped', 'help_required', 'medicine_unavailable', 'unable_to_contact', 'further_assistance_required')),
  resolution_notes TEXT,
  escalation_count INT NOT NULL DEFAULT 0,
  last_escalated_at TIMESTAMPTZ
);

-- Idempotency & Duplicate Prevention: Only 1 active follow-up task per medication at any time
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_followup 
ON public.follow_up_tasks (medication_id) 
WHERE status != 'resolved';

CREATE INDEX IF NOT EXISTS idx_follow_up_tasks_elder ON public.follow_up_tasks(elder_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_tasks_caregiver ON public.follow_up_tasks(assigned_caregiver_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_tasks_status ON public.follow_up_tasks(status);

-- --------------------------------------------------------------------
-- 9. Caregiver Escalations Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.caregiver_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.follow_up_tasks(id) ON DELETE CASCADE,
  from_caregiver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  to_caregiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  escalation_level INT NOT NULL DEFAULT 1,
  reason TEXT NOT NULL,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_caregiver_escalations_task ON public.caregiver_escalations(task_id);

-- --------------------------------------------------------------------
-- 10. Appointments Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id UUID NOT NULL REFERENCES public.elder_profiles(id) ON DELETE CASCADE,
  doctor_name TEXT NOT NULL,
  specialty TEXT,
  clinic TEXT,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  type TEXT NOT NULL DEFAULT 'in-person' CHECK (type IN ('in-person', 'video', 'home-visit')),
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
  companion_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_elder ON public.appointments(elder_id);

-- --------------------------------------------------------------------
-- 11. Care Activity (Timeline Journal)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.care_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id UUID NOT NULL REFERENCES public.elder_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('medication', 'vitals', 'voice', 'alert', 'note', 'appointment', 'activity')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'normal' CHECK (severity IN ('normal', 'attention', 'critical')),
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_care_activity_elder ON public.care_activity(elder_id);
CREATE INDEX IF NOT EXISTS idx_care_activity_type ON public.care_activity(type);
CREATE INDEX IF NOT EXISTS idx_care_activity_created ON public.care_activity(created_at DESC);

-- --------------------------------------------------------------------
-- 12. Notification Logs Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('push', 'sms', 'email', 'voice')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
  dispatched_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient ON public.notification_logs(recipient_id);

-- --------------------------------------------------------------------
-- 13. Audit Logs Table (Append-Only)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
