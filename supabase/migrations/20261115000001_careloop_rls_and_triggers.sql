-- ====================================================================
-- ElderCare 360 Row Level Security (RLS), Functions & Triggers
-- Migration: 20261115000001_careloop_rls_and_triggers.sql
-- ====================================================================

-- --------------------------------------------------------------------
-- Security Helper Functions
-- --------------------------------------------------------------------

-- Check if current authenticated user is an authorized member of an elder's care circle
CREATE OR REPLACE FUNCTION public.is_elder_member(elder_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.elder_profiles ep 
    WHERE ep.id = elder_uuid AND ep.user_id = auth.uid()
    UNION
    SELECT 1 FROM public.care_memberships cm 
    WHERE cm.elder_id = elder_uuid AND cm.user_id = auth.uid() AND cm.status = 'active'
  );
$$;

-- Check if user is primary caregiver or has permission to manage medications
CREATE OR REPLACE FUNCTION public.can_manage_elder_meds(elder_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.elder_profiles ep 
    WHERE ep.id = elder_uuid AND ep.user_id = auth.uid()
    UNION
    SELECT 1 FROM public.care_memberships cm 
    WHERE cm.elder_id = elder_uuid AND cm.user_id = auth.uid() AND cm.status = 'active' 
      AND (cm.can_manage_meds = true OR cm.role IN ('primary_caregiver', 'visiting_nurse'))
  );
$$;

-- --------------------------------------------------------------------
-- Enable RLS On All Tables
-- --------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elder_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dose_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dose_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- 1. Profiles Policies
-- --------------------------------------------------------------------
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Care circle members can view peers"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.care_memberships cm1
      JOIN public.care_memberships cm2 ON cm1.elder_id = cm2.elder_id
      WHERE cm1.user_id = auth.uid() AND cm2.user_id = profiles.id AND cm1.status = 'active'
    )
  );

-- --------------------------------------------------------------------
-- 2. Elder Profiles Policies
-- --------------------------------------------------------------------
CREATE POLICY "Elders can view own elder profile"
  ON public.elder_profiles FOR SELECT
  USING (public.is_elder_member(id));

CREATE POLICY "Primary caregiver can update elder profile"
  ON public.elder_profiles FOR UPDATE
  USING (
    user_id = auth.uid() OR primary_caregiver_id = auth.uid()
  );

-- --------------------------------------------------------------------
-- 3. Care Memberships Policies
-- --------------------------------------------------------------------
CREATE POLICY "Members can view care memberships of their circles"
  ON public.care_memberships FOR SELECT
  USING (public.is_elder_member(elder_id));

CREATE POLICY "Primary caregiver can manage memberships"
  ON public.care_memberships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.elder_profiles ep
      WHERE ep.id = care_memberships.elder_id AND (ep.user_id = auth.uid() OR ep.primary_caregiver_id = auth.uid())
    )
  );

-- --------------------------------------------------------------------
-- 4. Care Invites Policies
-- --------------------------------------------------------------------
CREATE POLICY "Members can view active invites"
  ON public.care_invites FOR SELECT
  USING (public.is_elder_member(elder_id) OR auth.uid() IS NOT NULL);

CREATE POLICY "Primary caregiver can create invites"
  ON public.care_invites FOR INSERT
  WITH CHECK (public.is_elder_member(elder_id));

CREATE POLICY "Invites can be revoked by caregiver"
  ON public.care_invites FOR UPDATE
  USING (public.is_elder_member(elder_id));

-- --------------------------------------------------------------------
-- 5. Medications & Schedules Policies
-- --------------------------------------------------------------------
CREATE POLICY "Members can view medications"
  ON public.medications FOR SELECT
  USING (public.is_elder_member(elder_id));

CREATE POLICY "Authorized caregivers can manage medications"
  ON public.medications FOR ALL
  USING (public.can_manage_elder_meds(elder_id));

CREATE POLICY "Members can view schedules"
  ON public.dose_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.medications m
      WHERE m.id = dose_schedules.medication_id AND public.is_elder_member(m.elder_id)
    )
  );

-- --------------------------------------------------------------------
-- 6. Dose Events Policies
-- --------------------------------------------------------------------
CREATE POLICY "Members can view dose events"
  ON public.dose_events FOR SELECT
  USING (public.is_elder_member(elder_id));

CREATE POLICY "Elders and caregivers can insert dose events"
  ON public.dose_events FOR INSERT
  WITH CHECK (public.is_elder_member(elder_id));

-- --------------------------------------------------------------------
-- 7. Follow-Up Tasks Policies
-- --------------------------------------------------------------------
CREATE POLICY "Care members can view follow up tasks"
  ON public.follow_up_tasks FOR SELECT
  USING (public.is_elder_member(elder_id));

CREATE POLICY "Authorized caregivers can update follow up tasks"
  ON public.follow_up_tasks FOR UPDATE
  USING (public.is_elder_member(elder_id));

-- --------------------------------------------------------------------
-- 8. Care Activity Policies
-- --------------------------------------------------------------------
CREATE POLICY "Members can view care activity journal"
  ON public.care_activity FOR SELECT
  USING (public.is_elder_member(elder_id));

CREATE POLICY "Members can insert care activity notes"
  ON public.care_activity FOR INSERT
  WITH CHECK (public.is_elder_member(elder_id));

-- --------------------------------------------------------------------
-- 9. Notification & Audit Logs Policies
-- --------------------------------------------------------------------
CREATE POLICY "Users can view own notification logs"
  ON public.notification_logs FOR SELECT
  USING (recipient_id = auth.uid());

CREATE POLICY "Audit logs are viewable by assigned caregivers and elders"
  ON public.audit_logs FOR SELECT
  USING (actor_id = auth.uid());

-- --------------------------------------------------------------------
-- Backend Scheduler & Detection Stored Procedures (For Supabase Cron)
-- --------------------------------------------------------------------

-- Check for unconfirmed doses past grace period and create follow up tasks idempotently
CREATE OR REPLACE FUNCTION public.check_unconfirmed_doses()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT := 0;
  r RECORD;
BEGIN
  FOR r IN
    SELECT 
      m.id AS medication_id,
      m.name AS medication_name,
      m.elder_id,
      ds.id AS schedule_id,
      ds.schedule_time,
      ep.primary_caregiver_id
    FROM public.medications m
    JOIN public.dose_schedules ds ON ds.medication_id = m.id AND ds.is_active = true
    JOIN public.elder_profiles ep ON ep.id = m.elder_id
    WHERE m.is_active = true
      AND ep.primary_caregiver_id IS NOT NULL
      -- Scheduled time + grace period has passed today
      AND CURRENT_TIME > (ds.schedule_time + (ds.grace_period_minutes || ' minutes')::interval)
      -- No dose event logged for today
      AND NOT EXISTS (
        SELECT 1 FROM public.dose_events de
        WHERE de.medication_id = m.id
          AND de.recorded_at::date = CURRENT_DATE
          AND de.status IN ('taken', 'skipped')
      )
      -- No active follow-up task already open
      AND NOT EXISTS (
        SELECT 1 FROM public.follow_up_tasks ft
        WHERE ft.medication_id = m.id
          AND ft.status != 'resolved'
      )
  LOOP
    INSERT INTO public.follow_up_tasks (
      elder_id,
      medication_id,
      schedule_id,
      assigned_caregiver_id,
      reason,
      status
    ) VALUES (
      r.elder_id,
      r.medication_id,
      r.schedule_id,
      r.primary_caregiver_id,
      'Automated Detection: Scheduled dose at ' || r.schedule_time || ' unconfirmed past grace period',
      'pending'
    );

    INSERT INTO public.care_activity (
      elder_id,
      type,
      title,
      description,
      severity,
      author_name,
      author_role
    ) VALUES (
      r.elder_id,
      'alert',
      '⚠️ Unconfirmed Dose Detected: ' || r.medication_name,
      'Scheduled dose remained unconfirmed past the grace period. Follow-up task auto-assigned to primary caregiver.',
      'attention',
      'CareLoop Scheduler',
      'System Automation'
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Trigger to automatically populate public.profiles on auth.users registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, avatar_url, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'caregiver'),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.phone
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
