-- Data-preserving hardening and RPCs for authenticated care collaboration.
-- Review this migration against the target database before applying it.

ALTER TABLE public.elder_profiles
  ADD COLUMN IF NOT EXISTS timezone_name TEXT NOT NULL DEFAULT 'UTC';

ALTER TABLE public.care_invites
  ADD COLUMN IF NOT EXISTS can_manage_meds BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.follow_up_tasks
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;

ALTER TABLE public.dose_events
  ADD COLUMN IF NOT EXISTS idempotency_key UUID;

DROP INDEX IF EXISTS public.idx_unique_active_followup;
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_followup_dose
  ON public.follow_up_tasks (medication_id, scheduled_for)
  WHERE scheduled_for IS NOT NULL AND status <> 'resolved';

CREATE UNIQUE INDEX IF NOT EXISTS idx_dose_events_idempotency_key
  ON public.dose_events (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.is_elder_owner(elder_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.elder_profiles AS ep
    WHERE ep.id = elder_uuid AND ep.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_elder_member(elder_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.is_elder_owner(elder_uuid)
    OR EXISTS (
      SELECT 1
      FROM public.care_memberships AS cm
      WHERE cm.elder_id = elder_uuid
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_elder_meds(elder_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.is_elder_owner(elder_uuid)
    OR EXISTS (
      SELECT 1
      FROM public.care_memberships AS cm
      WHERE cm.elder_id = elder_uuid
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
        AND (cm.can_manage_meds OR cm.role IN ('primary_caregiver', 'visiting_nurse'))
    );
$$;

CREATE OR REPLACE FUNCTION public.can_acknowledge_elder_tasks(elder_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.is_elder_owner(elder_uuid)
    OR EXISTS (
      SELECT 1
      FROM public.care_memberships AS cm
      WHERE cm.elder_id = elder_uuid
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
        AND cm.can_acknowledge_tasks
    );
$$;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Care circle members can view peers" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());
CREATE POLICY "Active care members can view peers"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.care_memberships AS mine
      JOIN public.care_memberships AS peer ON peer.elder_id = mine.elder_id
      WHERE mine.user_id = auth.uid()
        AND mine.status = 'active'
        AND peer.user_id = profiles.id
        AND peer.status = 'active'
    )
  );
CREATE POLICY "Users can update allowed profile fields"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (full_name, avatar_url, phone, relationship, emergency_contact, updated_at)
  ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "Elders can view own elder profile" ON public.elder_profiles;
DROP POLICY IF EXISTS "Primary caregiver can update elder profile" ON public.elder_profiles;
CREATE POLICY "Care members can view elder profiles"
  ON public.elder_profiles FOR SELECT TO authenticated
  USING (public.is_elder_member(id));
CREATE POLICY "Owners can create their elder profile"
  ON public.elder_profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owners can update their elder profile"
  ON public.elder_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Members can view care memberships of their circles" ON public.care_memberships;
DROP POLICY IF EXISTS "Primary caregiver can manage memberships" ON public.care_memberships;
CREATE POLICY "Care members can view memberships"
  ON public.care_memberships FOR SELECT TO authenticated
  USING (public.is_elder_member(elder_id));
CREATE POLICY "Elder owners control memberships"
  ON public.care_memberships FOR ALL TO authenticated
  USING (public.is_elder_owner(elder_id))
  WITH CHECK (public.is_elder_owner(elder_id));

DROP POLICY IF EXISTS "Members can view active invites" ON public.care_invites;
DROP POLICY IF EXISTS "Primary caregiver can create invites" ON public.care_invites;
DROP POLICY IF EXISTS "Invites can be revoked by caregiver" ON public.care_invites;
REVOKE ALL ON public.care_invites FROM anon, authenticated;

DROP POLICY IF EXISTS "Members can view medications" ON public.medications;
DROP POLICY IF EXISTS "Authorized caregivers can manage medications" ON public.medications;
CREATE POLICY "Care members can view medications"
  ON public.medications FOR SELECT TO authenticated
  USING (public.is_elder_member(elder_id));
CREATE POLICY "Authorized members can manage medications"
  ON public.medications FOR ALL TO authenticated
  USING (public.can_manage_elder_meds(elder_id))
  WITH CHECK (public.can_manage_elder_meds(elder_id));

DROP POLICY IF EXISTS "Members can view schedules" ON public.dose_schedules;
CREATE POLICY "Care members can view schedules"
  ON public.dose_schedules FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.medications AS m
      WHERE m.id = dose_schedules.medication_id
        AND public.is_elder_member(m.elder_id)
    )
  );
CREATE POLICY "Authorized members can manage schedules"
  ON public.dose_schedules FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.medications AS m
      WHERE m.id = dose_schedules.medication_id
        AND public.can_manage_elder_meds(m.elder_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.medications AS m
      WHERE m.id = dose_schedules.medication_id
        AND public.can_manage_elder_meds(m.elder_id)
    )
  );

DROP POLICY IF EXISTS "Members can view dose events" ON public.dose_events;
DROP POLICY IF EXISTS "Elders and caregivers can insert dose events" ON public.dose_events;
CREATE POLICY "Care members can view dose events"
  ON public.dose_events FOR SELECT TO authenticated
  USING (public.is_elder_member(elder_id));
REVOKE INSERT, UPDATE, DELETE ON public.dose_events FROM anon, authenticated;

DROP POLICY IF EXISTS "Care members can view follow up tasks" ON public.follow_up_tasks;
DROP POLICY IF EXISTS "Authorized caregivers can update follow up tasks" ON public.follow_up_tasks;
CREATE POLICY "Care members can view follow up tasks"
  ON public.follow_up_tasks FOR SELECT TO authenticated
  USING (public.is_elder_member(elder_id));
REVOKE INSERT, UPDATE, DELETE ON public.follow_up_tasks FROM anon, authenticated;

DROP POLICY IF EXISTS "Members can view care activity journal" ON public.care_activity;
DROP POLICY IF EXISTS "Members can insert care activity notes" ON public.care_activity;
CREATE POLICY "Care members can view care activity"
  ON public.care_activity FOR SELECT TO authenticated
  USING (public.is_elder_member(elder_id));
REVOKE INSERT, UPDATE, DELETE ON public.care_activity FROM anon, authenticated;

CREATE POLICY "Care members can view caregiver escalations"
  ON public.caregiver_escalations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.follow_up_tasks AS task
      WHERE task.id = caregiver_escalations.task_id
        AND public.is_elder_member(task.elder_id)
    )
  );
REVOKE INSERT, UPDATE, DELETE ON public.caregiver_escalations FROM anon, authenticated;

CREATE POLICY "Care members can view appointments"
  ON public.appointments FOR SELECT TO authenticated
  USING (public.is_elder_member(elder_id));
CREATE POLICY "Authorized members can manage appointments"
  ON public.appointments FOR ALL TO authenticated
  USING (public.can_manage_elder_meds(elder_id))
  WITH CHECK (public.can_manage_elder_meds(elder_id));

DROP POLICY IF EXISTS "Users can view own notification logs" ON public.notification_logs;
CREATE POLICY "Users can view own notification logs"
  ON public.notification_logs FOR SELECT TO authenticated
  USING (recipient_id = auth.uid());
REVOKE INSERT, UPDATE, DELETE ON public.notification_logs FROM anon, authenticated;

DROP POLICY IF EXISTS "Audit logs are viewable by assigned caregivers and elders" ON public.audit_logs;
CREATE POLICY "Users can view their own audit records"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (actor_id = auth.uid());
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.ensure_own_elder_profile(
  p_full_name TEXT DEFAULT NULL,
  p_timezone_name TEXT DEFAULT 'UTC'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_elder_id UUID;
  v_full_name TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user_id::TEXT, 0));
  SELECT ep.id INTO v_elder_id
  FROM public.elder_profiles AS ep
  WHERE ep.user_id = v_user_id
  ORDER BY ep.created_at
  LIMIT 1;
  IF v_elder_id IS NOT NULL THEN
    RETURN v_elder_id;
  END IF;

  SELECT p.full_name INTO v_full_name
  FROM public.profiles AS p
  WHERE p.id = v_user_id AND p.role = 'elderly';
  IF v_full_name IS NULL THEN
    RAISE EXCEPTION 'Only an elderly account can create its own elder profile';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_timezone_names AS timezone
    WHERE timezone.name = COALESCE(NULLIF(p_timezone_name, ''), 'UTC')
  ) THEN
    RAISE EXCEPTION 'Unknown time zone';
  END IF;

  INSERT INTO public.elder_profiles (user_id, full_name, timezone_name)
  VALUES (v_user_id, COALESCE(NULLIF(p_full_name, ''), v_full_name), COALESCE(NULLIF(p_timezone_name, ''), 'UTC'))
  RETURNING id INTO v_elder_id;
  RETURN v_elder_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_care_invite(
  p_elder_id UUID,
  p_role TEXT,
  p_relationship TEXT,
  p_phone TEXT DEFAULT NULL,
  p_can_manage_meds BOOLEAN DEFAULT false
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_code TEXT := pg_catalog.encode(public.gen_random_bytes(32), 'hex');
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_elder_owner(p_elder_id) THEN
    RAISE EXCEPTION 'Only the elder profile owner can invite care members';
  END IF;
  IF p_role NOT IN ('primary_caregiver', 'family_member', 'visiting_nurse', 'doctor', 'emergency_contact') THEN
    RAISE EXCEPTION 'Invalid care membership role';
  END IF;
  IF p_relationship IS NULL OR pg_catalog.length(pg_catalog.btrim(p_relationship)) = 0 THEN
    RAISE EXCEPTION 'Relationship is required';
  END IF;

  INSERT INTO public.care_invites (
    elder_id, invited_by, invite_code, phone, role, relationship, can_manage_meds
  ) VALUES (
    p_elder_id,
    auth.uid(),
    pg_catalog.encode(public.digest(v_code, 'sha256'), 'hex'),
    NULLIF(pg_catalog.btrim(p_phone), ''),
    p_role,
    pg_catalog.btrim(p_relationship),
    COALESCE(p_can_manage_meds, false)
  );
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_care_invite(p_invite_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_invite public.care_invites%ROWTYPE;
  v_membership_id UUID;
  v_profile_phone TEXT;
BEGIN
  IF auth.uid() IS NULL OR p_invite_code IS NULL OR pg_catalog.length(p_invite_code) < 32 THEN
    RAISE EXCEPTION 'A valid invitation and authenticated account are required';
  END IF;

  SELECT * INTO v_invite
  FROM public.care_invites AS invite
  WHERE invite.invite_code = pg_catalog.encode(public.digest(p_invite_code, 'sha256'), 'hex')
     OR invite.invite_code = p_invite_code
  FOR UPDATE;
  IF NOT FOUND OR v_invite.accepted_at IS NOT NULL OR v_invite.revoked_at IS NOT NULL
     OR v_invite.expires_at <= pg_catalog.now() THEN
    RAISE EXCEPTION 'Invitation is invalid, expired, revoked, or already accepted';
  END IF;

  IF v_invite.phone IS NOT NULL THEN
    SELECT profile.phone INTO v_profile_phone
    FROM public.profiles AS profile
    WHERE profile.id = auth.uid();
    IF v_profile_phone IS DISTINCT FROM v_invite.phone THEN
      RAISE EXCEPTION 'The signed-in account does not match the invited phone number';
    END IF;
  END IF;

  INSERT INTO public.care_memberships (
    elder_id, user_id, role, relationship, can_manage_meds, can_acknowledge_tasks, status
  ) VALUES (
    v_invite.elder_id,
    auth.uid(),
    v_invite.role,
    v_invite.relationship,
    v_invite.can_manage_meds,
    true,
    'active'
  )
  ON CONFLICT (elder_id, user_id) DO UPDATE
    SET role = EXCLUDED.role,
        relationship = EXCLUDED.relationship,
        can_manage_meds = EXCLUDED.can_manage_meds,
        can_acknowledge_tasks = true,
        status = 'active',
        updated_at = pg_catalog.now()
  RETURNING id INTO v_membership_id;

  UPDATE public.care_invites
  SET accepted_at = pg_catalog.now(), accepted_by = auth.uid()
  WHERE id = v_invite.id;
  RETURN v_membership_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_care_invite(p_invite_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_elder_id UUID;
BEGIN
  SELECT invite.elder_id INTO v_elder_id
  FROM public.care_invites AS invite
  WHERE invite.id = p_invite_id AND invite.accepted_at IS NULL;
  IF v_elder_id IS NULL OR NOT public.is_elder_owner(v_elder_id) THEN
    RAISE EXCEPTION 'Only the elder profile owner can revoke this invitation';
  END IF;
  UPDATE public.care_invites
  SET revoked_at = pg_catalog.now()
  WHERE id = p_invite_id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_follow_up_for_dose(
  p_medication_id UUID,
  p_scheduled_for TIMESTAMPTZ,
  p_reason TEXT,
  p_schedule_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_elder_id UUID;
  v_assignee UUID;
  v_task_id UUID;
BEGIN
  SELECT medication.elder_id INTO v_elder_id
  FROM public.medications AS medication
  WHERE medication.id = p_medication_id AND medication.is_active;
  IF v_elder_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT membership.user_id INTO v_assignee
  FROM public.care_memberships AS membership
  WHERE membership.elder_id = v_elder_id
    AND membership.status = 'active'
    AND membership.can_acknowledge_tasks
    AND membership.role = 'primary_caregiver'
  ORDER BY membership.escalation_priority, membership.created_at
  LIMIT 1;

  IF v_assignee IS NULL THEN
    SELECT membership.user_id INTO v_assignee
    FROM public.care_memberships AS membership
    WHERE membership.elder_id = v_elder_id
      AND membership.status = 'active'
      AND membership.can_acknowledge_tasks
    ORDER BY membership.escalation_priority, membership.created_at
    LIMIT 1;
  END IF;
  IF v_assignee IS NULL THEN
    SELECT elder.user_id INTO v_assignee
    FROM public.elder_profiles AS elder
    WHERE elder.id = v_elder_id;
  END IF;
  IF v_assignee IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.follow_up_tasks (
    elder_id, medication_id, schedule_id, assigned_caregiver_id,
    scheduled_for, reason, status
  ) VALUES (
    v_elder_id, p_medication_id, p_schedule_id, v_assignee,
    p_scheduled_for, p_reason, 'pending'
  )
  ON CONFLICT (medication_id, scheduled_for)
    WHERE scheduled_for IS NOT NULL AND status <> 'resolved'
  DO NOTHING
  RETURNING id INTO v_task_id;

  IF v_task_id IS NULL THEN
    SELECT task.id INTO v_task_id
    FROM public.follow_up_tasks AS task
    WHERE task.medication_id = p_medication_id
      AND task.scheduled_for = p_scheduled_for
      AND task.status <> 'resolved'
    LIMIT 1;
  END IF;
  RETURN v_task_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.append_care_activity(
  p_elder_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_description TEXT,
  p_severity TEXT DEFAULT 'normal'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_author_name TEXT;
  v_author_role TEXT;
  v_activity_id UUID;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_elder_member(p_elder_id) THEN
    RAISE EXCEPTION 'Not authorized for this care profile';
  END IF;
  IF p_type NOT IN ('medication', 'vitals', 'voice', 'alert', 'note', 'appointment', 'activity')
     OR p_severity NOT IN ('normal', 'attention', 'critical') THEN
    RAISE EXCEPTION 'Invalid activity type or severity';
  END IF;

  SELECT profile.full_name, profile.role INTO v_author_name, v_author_role
  FROM public.profiles AS profile
  WHERE profile.id = auth.uid();

  INSERT INTO public.care_activity (
    elder_id, type, title, description, severity, author_id, author_name, author_role
  ) VALUES (
    p_elder_id, p_type, p_title, p_description, p_severity,
    auth.uid(), COALESCE(v_author_name, 'Care team member'), COALESCE(v_author_role, 'family')
  )
  RETURNING id INTO v_activity_id;
  RETURN v_activity_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_dose_event(
  p_medication_id UUID,
  p_status TEXT,
  p_scheduled_for TIMESTAMPTZ,
  p_notes TEXT DEFAULT NULL,
  p_snooze_until TIMESTAMPTZ DEFAULT NULL,
  p_idempotency_key UUID DEFAULT public.gen_random_uuid()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_elder_id UUID;
  v_owner_id UUID;
  v_event_id UUID;
  v_actor_name TEXT;
  v_actor_role TEXT;
  v_event_key UUID := COALESCE(p_idempotency_key, public.gen_random_uuid());
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_status NOT IN ('taken', 'skipped', 'snoozed', 'help_requested') THEN
    RAISE EXCEPTION 'Unsupported client dose status';
  END IF;
  IF p_scheduled_for IS NULL OR p_scheduled_for > pg_catalog.now() + INTERVAL '1 day' THEN
    RAISE EXCEPTION 'A valid scheduled dose time is required';
  END IF;

  SELECT medication.elder_id, elder.user_id INTO v_elder_id, v_owner_id
  FROM public.medications AS medication
  JOIN public.elder_profiles AS elder ON elder.id = medication.elder_id
  WHERE medication.id = p_medication_id AND medication.is_active;
  IF v_elder_id IS NULL OR NOT public.is_elder_member(v_elder_id) THEN
    RAISE EXCEPTION 'Not authorized for this medication';
  END IF;
  IF auth.uid() <> v_owner_id AND NOT public.can_acknowledge_elder_tasks(v_elder_id) THEN
    RAISE EXCEPTION 'Care membership does not permit dose actions';
  END IF;

  SELECT profile.full_name, profile.role INTO v_actor_name, v_actor_role
  FROM public.profiles AS profile
  WHERE profile.id = auth.uid();

  INSERT INTO public.dose_events (
    medication_id, elder_id, scheduled_for, status, recorded_by,
    recorded_by_name, confirmed_by_type, snooze_until, notes, idempotency_key
  ) VALUES (
    p_medication_id,
    v_elder_id,
    p_scheduled_for,
    p_status,
    auth.uid(),
    COALESCE(v_actor_name, 'Care team member'),
    CASE WHEN auth.uid() = v_owner_id THEN 'self' ELSE 'caregiver' END,
    p_snooze_until,
    p_notes,
    v_event_key
  )
  ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL
  DO NOTHING
  RETURNING id INTO v_event_id;

  IF v_event_id IS NULL THEN
    SELECT event.id INTO v_event_id
    FROM public.dose_events AS event
    WHERE event.idempotency_key = v_event_key;
    RETURN v_event_id;
  END IF;

  IF p_status IN ('taken', 'skipped') THEN
    UPDATE public.follow_up_tasks
    SET status = 'resolved',
        resolved_at = pg_catalog.now(),
        resolved_by = auth.uid(),
        resolution_type = CASE WHEN p_status = 'taken' THEN 'dose_taken' ELSE 'dose_skipped' END,
        resolution_notes = p_notes
    WHERE medication_id = p_medication_id
      AND scheduled_for = p_scheduled_for
      AND status <> 'resolved';
  END IF;

  IF p_status = 'help_requested' THEN
    PERFORM public.create_follow_up_for_dose(
      p_medication_id,
      p_scheduled_for,
      COALESCE(NULLIF(pg_catalog.btrim(p_notes), ''), 'Elder requested help with this dose')
    );
  END IF;

  PERFORM public.append_care_activity(
    v_elder_id,
    CASE WHEN p_status = 'help_requested' THEN 'alert' ELSE 'medication' END,
    CASE p_status
      WHEN 'taken' THEN 'Dose confirmed taken'
      WHEN 'skipped' THEN 'Dose marked skipped'
      WHEN 'snoozed' THEN 'Dose reminder snoozed'
      ELSE 'Help requested for medication'
    END,
    COALESCE(NULLIF(pg_catalog.btrim(p_notes), ''), 'Dose status: ' || p_status),
    CASE WHEN p_status = 'help_requested' OR p_status = 'skipped' THEN 'attention' ELSE 'normal' END
  );

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    'dose.' || p_status,
    'dose_event',
    v_event_id::TEXT,
    pg_catalog.jsonb_build_object('elder_id', v_elder_id, 'medication_id', p_medication_id)
  );
  RETURN v_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.acknowledge_follow_up_task(p_task_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_task public.follow_up_tasks%ROWTYPE;
BEGIN
  SELECT * INTO v_task
  FROM public.follow_up_tasks AS task
  WHERE task.id = p_task_id
  FOR UPDATE;
  IF NOT FOUND OR NOT public.is_elder_member(v_task.elder_id)
     OR NOT public.can_acknowledge_elder_tasks(v_task.elder_id)
     OR (auth.uid() <> v_task.assigned_caregiver_id AND NOT public.is_elder_owner(v_task.elder_id)) THEN
    RAISE EXCEPTION 'Not authorized to acknowledge this task';
  END IF;
  IF v_task.status = 'resolved' THEN
    RAISE EXCEPTION 'A resolved task cannot be acknowledged';
  END IF;
  IF v_task.status <> 'acknowledged' THEN
    UPDATE public.follow_up_tasks
    SET status = 'acknowledged',
        acknowledged_at = pg_catalog.now(),
        acknowledged_by = auth.uid()
    WHERE id = p_task_id;
    PERFORM public.append_care_activity(
      v_task.elder_id,
      'note',
      'Caregiver acknowledged a follow-up',
      'The follow-up was acknowledged. Dose status remains unconfirmed.',
      'normal'
    );
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), 'task.acknowledged', 'follow_up_task', p_task_id::TEXT,
            pg_catalog.jsonb_build_object('elder_id', v_task.elder_id));
  END IF;
  RETURN p_task_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.escalate_follow_up_task_internal(p_task_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_task public.follow_up_tasks%ROWTYPE;
  v_next_caregiver UUID;
  v_next_level INTEGER;
BEGIN
  SELECT * INTO v_task
  FROM public.follow_up_tasks AS task
  WHERE task.id = p_task_id
  FOR UPDATE;
  IF NOT FOUND OR v_task.status = 'resolved' THEN
    RETURN false;
  END IF;

  SELECT membership.user_id INTO v_next_caregiver
  FROM public.care_memberships AS membership
  WHERE membership.elder_id = v_task.elder_id
    AND membership.status = 'active'
    AND membership.can_acknowledge_tasks
    AND membership.user_id <> v_task.assigned_caregiver_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.caregiver_escalations AS previous
      WHERE previous.task_id = v_task.id
        AND previous.to_caregiver_id = membership.user_id
    )
  ORDER BY membership.escalation_priority, membership.created_at
  LIMIT 1;
  IF v_next_caregiver IS NULL THEN
    RETURN false;
  END IF;

  v_next_level := COALESCE(v_task.escalation_count, 0) + 1;
  INSERT INTO public.caregiver_escalations (
    task_id, from_caregiver_id, to_caregiver_id, escalation_level, reason
  ) VALUES (
    v_task.id,
    v_task.assigned_caregiver_id,
    v_next_caregiver,
    v_next_level,
    'Automated follow-up escalation'
  );

  UPDATE public.follow_up_tasks
  SET assigned_caregiver_id = v_next_caregiver,
      status = 'escalated',
      escalation_count = v_next_level,
      last_escalated_at = pg_catalog.now()
  WHERE id = v_task.id;

  INSERT INTO public.care_activity (
    elder_id, type, title, description, severity, author_id, author_name, author_role
  ) VALUES (
    v_task.elder_id,
    'alert',
    'Care follow-up escalated',
    'An unresolved follow-up was reassigned to the next authorized caregiver.',
    'critical',
    auth.uid(),
    COALESCE(
      (SELECT profile.full_name FROM public.profiles AS profile WHERE profile.id = auth.uid()),
      'CareLoop Scheduler'
    ),
    COALESCE(
      (SELECT profile.role FROM public.profiles AS profile WHERE profile.id = auth.uid()),
      'System'
    )
  );
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (NULL, 'task.escalated', 'follow_up_task', v_task.id::TEXT,
          pg_catalog.jsonb_build_object('elder_id', v_task.elder_id, 'assigned_to', v_next_caregiver));
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.escalate_follow_up_task(p_task_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_elder_id UUID;
  v_assigned_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  SELECT task.elder_id, task.assigned_caregiver_id
    INTO v_elder_id, v_assigned_id
  FROM public.follow_up_tasks AS task
  WHERE task.id = p_task_id;
  IF v_elder_id IS NULL OR NOT public.is_elder_member(v_elder_id)
     OR (auth.uid() <> v_assigned_id AND NOT public.is_elder_owner(v_elder_id)) THEN
    RAISE EXCEPTION 'Not authorized to escalate this task';
  END IF;
  RETURN public.escalate_follow_up_task_internal(p_task_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_follow_up_task(
  p_task_id UUID,
  p_resolution_type TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_task public.follow_up_tasks%ROWTYPE;
  v_owner_id UUID;
  v_actor_name TEXT;
BEGIN
  IF auth.uid() IS NULL OR p_resolution_type NOT IN (
    'dose_taken', 'dose_skipped', 'help_required', 'medicine_unavailable',
    'unable_to_contact', 'further_assistance_required'
  ) THEN
    RAISE EXCEPTION 'Authentication and a valid resolution are required';
  END IF;

  SELECT * INTO v_task
  FROM public.follow_up_tasks AS task
  WHERE task.id = p_task_id
  FOR UPDATE;
  IF NOT FOUND OR NOT public.is_elder_member(v_task.elder_id)
     OR NOT public.can_acknowledge_elder_tasks(v_task.elder_id)
     OR (auth.uid() <> v_task.assigned_caregiver_id AND NOT public.is_elder_owner(v_task.elder_id)) THEN
    RAISE EXCEPTION 'Not authorized to resolve this task';
  END IF;
  IF v_task.status = 'resolved' THEN
    RETURN p_task_id;
  END IF;

  SELECT elder.user_id INTO v_owner_id
  FROM public.elder_profiles AS elder
  WHERE elder.id = v_task.elder_id;
  SELECT profile.full_name INTO v_actor_name
  FROM public.profiles AS profile
  WHERE profile.id = auth.uid();

  UPDATE public.follow_up_tasks
  SET status = 'resolved',
      resolved_at = pg_catalog.now(),
      resolved_by = auth.uid(),
      resolution_type = p_resolution_type,
      resolution_notes = p_notes
  WHERE id = p_task_id;

  IF p_resolution_type IN ('dose_taken', 'dose_skipped') THEN
    INSERT INTO public.dose_events (
      medication_id, elder_id, scheduled_for, status, recorded_by, recorded_by_name,
      confirmed_by_type, notes, idempotency_key
    ) VALUES (
      v_task.medication_id,
      v_task.elder_id,
      COALESCE(v_task.scheduled_for, pg_catalog.now()),
      CASE WHEN p_resolution_type = 'dose_taken' THEN 'taken' ELSE 'skipped' END,
      auth.uid(),
      COALESCE(v_actor_name, 'Care team member'),
      CASE WHEN auth.uid() = v_owner_id THEN 'self' ELSE 'caregiver' END,
      p_notes,
      public.gen_random_uuid()
    );
  END IF;

  PERFORM public.append_care_activity(
    v_task.elder_id,
    CASE WHEN p_resolution_type = 'dose_taken' THEN 'medication' ELSE 'note' END,
    'Care follow-up resolved',
    COALESCE(NULLIF(pg_catalog.btrim(p_notes), ''), 'Resolution: ' || p_resolution_type),
    CASE WHEN p_resolution_type = 'dose_taken' THEN 'normal' ELSE 'attention' END
  );
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(), 'task.resolved', 'follow_up_task', p_task_id::TEXT,
    pg_catalog.jsonb_build_object('elder_id', v_task.elder_id, 'resolution_type', p_resolution_type)
  );
  RETURN p_task_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_careloop_followups()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_created_count INTEGER := 0;
  v_task RECORD;
  v_task_id UUID;
  v_escalated BOOLEAN;
BEGIN
  FOR v_task IN
    WITH eligible AS (
      SELECT
        medication.id AS medication_id,
        medication.elder_id,
        schedule.id AS schedule_id,
        schedule.schedule_time,
        schedule.grace_period_minutes,
        elder.timezone_name,
        ((pg_catalog.now() AT TIME ZONE elder.timezone_name)::DATE + schedule.schedule_time)
          AT TIME ZONE elder.timezone_name AS scheduled_for,
        pg_catalog.now() AT TIME ZONE elder.timezone_name AS now_local,
        medication.name AS medication_name
      FROM public.medications AS medication
      JOIN public.dose_schedules AS schedule
        ON schedule.medication_id = medication.id AND schedule.is_active
      JOIN public.elder_profiles AS elder ON elder.id = medication.elder_id
      WHERE medication.is_active
        AND EXTRACT(
          DOW FROM (pg_catalog.now() AT TIME ZONE elder.timezone_name)
        )::INTEGER = ANY(schedule.days_of_week)
    )
    SELECT eligible.*
    FROM eligible
    WHERE eligible.scheduled_for
            + (eligible.grace_period_minutes * INTERVAL '1 minute') <= pg_catalog.now()
      AND NOT EXISTS (
        SELECT 1
        FROM public.dose_events AS event
        WHERE event.medication_id = eligible.medication_id
          AND event.scheduled_for = eligible.scheduled_for
          AND event.status IN ('taken', 'skipped')
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.follow_up_tasks AS task
        WHERE task.medication_id = eligible.medication_id
          AND task.scheduled_for = eligible.scheduled_for
          AND task.status <> 'resolved'
      )
  LOOP
    PERFORM pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(v_task.medication_id::TEXT || v_task.scheduled_for::TEXT, 0)
    );
    IF NOT EXISTS (
      SELECT 1
      FROM public.follow_up_tasks AS active_task
      WHERE active_task.medication_id = v_task.medication_id
        AND active_task.scheduled_for = v_task.scheduled_for
        AND active_task.status <> 'resolved'
    ) THEN
      v_task_id := public.create_follow_up_for_dose(
        v_task.medication_id,
        v_task.scheduled_for,
        'Scheduled dose at ' || v_task.schedule_time || ' was not confirmed after the grace period',
        v_task.schedule_id
      );
      IF v_task_id IS NOT NULL THEN
        v_created_count := v_created_count + 1;
        INSERT INTO public.care_activity (
          elder_id, type, title, description, severity, author_name, author_role
        ) VALUES (
          v_task.elder_id,
          'alert',
          'Unconfirmed dose detected: ' || v_task.medication_name,
          'A scheduled dose passed its grace period without a taken or skipped event.',
          'attention',
          'CareLoop Scheduler',
          'System'
        );
      END IF;
    END IF;
  END LOOP;

  FOR v_task IN
    SELECT task.id
    FROM public.follow_up_tasks AS task
    WHERE task.status <> 'resolved'
      AND COALESCE(task.last_escalated_at, task.created_at) <= pg_catalog.now() - INTERVAL '15 minutes'
  LOOP
    v_escalated := public.escalate_follow_up_task_internal(v_task.id);
  END LOOP;

  RETURN v_created_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_unconfirmed_doses()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.process_careloop_followups();
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role TEXT;
  v_name TEXT;
BEGIN
  v_role := CASE NEW.raw_user_meta_data->>'role'
    WHEN 'elderly' THEN 'elderly'
    WHEN 'caregiver' THEN 'caregiver'
    WHEN 'family' THEN 'family'
    WHEN 'doctor' THEN 'doctor'
    ELSE 'caregiver'
  END;
  v_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.email, ''),
    'New user'
  );

  INSERT INTO public.profiles (id, full_name, role, avatar_url, phone, relationship)
  VALUES (
    NEW.id,
    v_name,
    v_role,
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'),
    NEW.raw_user_meta_data->>'relationship'
  )
  ON CONFLICT (id) DO NOTHING;

  IF v_role = 'elderly' AND NOT EXISTS (
    SELECT 1 FROM public.elder_profiles AS elder WHERE elder.user_id = NEW.id
  ) THEN
    INSERT INTO public.elder_profiles (user_id, full_name)
    VALUES (NEW.id, v_name);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE ALL ON FUNCTION public.is_elder_owner(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_elder_member(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_manage_elder_meds(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_acknowledge_elder_tasks(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_elder_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_elder_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_elder_meds(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_acknowledge_elder_tasks(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.ensure_own_elder_profile(TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_care_invite(UUID, TEXT, TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.accept_care_invite(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_care_invite(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_follow_up_for_dose(UUID, TIMESTAMPTZ, TEXT, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.append_care_activity(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_dose_event(UUID, TEXT, TIMESTAMPTZ, TEXT, TIMESTAMPTZ, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.acknowledge_follow_up_task(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.escalate_follow_up_task_internal(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.escalate_follow_up_task(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.resolve_follow_up_task(UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.process_careloop_followups() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_unconfirmed_doses() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.ensure_own_elder_profile(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_care_invite(UUID, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_care_invite(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_care_invite(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_dose_event(UUID, TEXT, TIMESTAMPTZ, TEXT, TIMESTAMPTZ, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.acknowledge_follow_up_task(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.escalate_follow_up_task(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_follow_up_task(UUID, TEXT, TEXT) TO authenticated;

DO $$
DECLARE
  v_job_exists BOOLEAN;
BEGIN
  IF pg_catalog.to_regclass('cron.job') IS NOT NULL THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM cron.job WHERE jobname = $1)'
      INTO v_job_exists
      USING 'eldercare-followups';
    IF NOT v_job_exists THEN
      EXECUTE $schedule$
        SELECT cron.schedule(
          'eldercare-followups',
          '* * * * *',
          'SELECT public.process_careloop_followups();'
        )
      $schedule$;
    END IF;
  END IF;
END;
$$;

DO $$
DECLARE
  v_table TEXT;
  v_tables TEXT[] := ARRAY['dose_events', 'follow_up_tasks', 'care_activity'];
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH v_table IN ARRAY v_tables LOOP
      IF NOT EXISTS (
        SELECT 1
        FROM pg_catalog.pg_publication_tables AS published
        WHERE published.pubname = 'supabase_realtime'
          AND published.schemaname = 'public'
          AND published.tablename = v_table
      ) THEN
        EXECUTE pg_catalog.format(
          'ALTER PUBLICATION supabase_realtime ADD TABLE public.%I',
          v_table
        );
      END IF;
    END LOOP;
  END IF;
END;
$$;
