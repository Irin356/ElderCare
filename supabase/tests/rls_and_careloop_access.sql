-- Run against a disposable Supabase local database after applying migrations.
-- All fixtures are rolled back; this is not a remote migration or production seed.
BEGIN;

INSERT INTO auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES
  ('10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
   'owner-a@example.invalid', '', pg_catalog.now(), '{}',
   '{"full_name":"Owner A","role":"elderly"}', pg_catalog.now(), pg_catalog.now()),
  ('10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
   'owner-b@example.invalid', '', pg_catalog.now(), '{}',
   '{"full_name":"Owner B","role":"elderly"}', pg_catalog.now(), pg_catalog.now()),
  ('10000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated',
   'caregiver@example.invalid', '', pg_catalog.now(), '{}',
   '{"full_name":"Caregiver","role":"caregiver"}', pg_catalog.now(), pg_catalog.now()),
  ('10000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated',
   'backup@example.invalid', '', pg_catalog.now(), '{}',
   '{"full_name":"Backup","role":"family"}', pg_catalog.now(), pg_catalog.now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.medications (id, elder_id, name, dosage, prescribed_by)
SELECT '20000000-0000-4000-8000-000000000001', id, 'Test Medication', '1 tablet', 'Test'
FROM public.elder_profiles
WHERE user_id = '10000000-0000-4000-8000-000000000001'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.dose_schedules (id, medication_id, schedule_time)
VALUES (
  '30000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '08:00'
)
ON CONFLICT (id) DO NOTHING;

SET LOCAL ROLE authenticated;

DO $$
DECLARE
  v_owner UUID := '10000000-0000-4000-8000-000000000001';
  v_other_owner UUID := '10000000-0000-4000-8000-000000000002';
  v_caregiver UUID := '10000000-0000-4000-8000-000000000003';
  v_backup UUID := '10000000-0000-4000-8000-000000000004';
  v_elder_id UUID;
  v_invite TEXT;
  v_task_id UUID;
  v_event_key UUID := '40000000-0000-4000-8000-000000000001';
  v_events_before BIGINT;
  v_rejected BOOLEAN := false;
BEGIN
  SELECT id INTO v_elder_id FROM public.elder_profiles WHERE user_id = v_owner;
  IF v_elder_id IS NULL THEN
    RAISE EXCEPTION 'Owner signup did not create its elder profile';
  END IF;

  PERFORM pg_catalog.set_config('request.jwt.claim.sub', v_owner::TEXT, true);
  PERFORM pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.jsonb_build_object('sub', v_owner, 'role', 'authenticated')::TEXT,
    true
  );
  IF NOT EXISTS (SELECT 1 FROM public.medications WHERE id = '20000000-0000-4000-8000-000000000001') THEN
    RAISE EXCEPTION 'Elder owner cannot access own medication';
  END IF;

  v_invite := public.create_care_invite(v_elder_id, 'primary_caregiver', 'Daughter', NULL, true);
  PERFORM pg_catalog.set_config('request.jwt.claim.sub', v_caregiver::TEXT, true);
  PERFORM pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.jsonb_build_object('sub', v_caregiver, 'role', 'authenticated')::TEXT,
    true
  );
  IF EXISTS (SELECT 1 FROM public.medications WHERE id = '20000000-0000-4000-8000-000000000001') THEN
    RAISE EXCEPTION 'Caregiver accessed elder data before accepting an invitation';
  END IF;
  PERFORM public.accept_care_invite(v_invite);

  PERFORM pg_catalog.set_config('request.jwt.claim.sub', v_owner::TEXT, true);
  PERFORM pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.jsonb_build_object('sub', v_owner, 'role', 'authenticated')::TEXT,
    true
  );
  v_invite := public.create_care_invite(v_elder_id, 'visiting_nurse', 'Nurse', NULL, false);
  PERFORM pg_catalog.set_config('request.jwt.claim.sub', v_backup::TEXT, true);
  PERFORM pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.jsonb_build_object('sub', v_backup, 'role', 'authenticated')::TEXT,
    true
  );
  PERFORM public.accept_care_invite(v_invite);

  PERFORM pg_catalog.set_config('request.jwt.claim.sub', v_owner::TEXT, true);
  PERFORM pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.jsonb_build_object('sub', v_owner, 'role', 'authenticated')::TEXT,
    true
  );
  PERFORM public.record_dose_event(
    '20000000-0000-4000-8000-000000000001',
    'help_requested',
    pg_catalog.now(),
    'Help requested',
    NULL,
    v_event_key
  );
  PERFORM public.record_dose_event(
    '20000000-0000-4000-8000-000000000001',
    'help_requested',
    pg_catalog.now(),
    'Retry',
    NULL,
    v_event_key
  );
  SELECT id INTO v_task_id
  FROM public.follow_up_tasks
  WHERE medication_id = '20000000-0000-4000-8000-000000000001'
    AND scheduled_for IS NOT NULL
    AND status <> 'resolved';
  IF v_task_id IS NULL THEN
    RAISE EXCEPTION 'A help request did not create a follow-up task';
  END IF;

  SELECT pg_catalog.count(*) INTO v_events_before
  FROM public.dose_events
  WHERE medication_id = '20000000-0000-4000-8000-000000000001';
  PERFORM pg_catalog.set_config('request.jwt.claim.sub', v_caregiver::TEXT, true);
  PERFORM pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.jsonb_build_object('sub', v_caregiver, 'role', 'authenticated')::TEXT,
    true
  );
  PERFORM public.acknowledge_follow_up_task(v_task_id);
  IF (SELECT status FROM public.follow_up_tasks WHERE id = v_task_id) <> 'acknowledged' THEN
    RAISE EXCEPTION 'Caregiver acknowledgement did not update task status';
  END IF;
  IF (SELECT status FROM public.dose_events WHERE idempotency_key = v_event_key) <> 'help_requested'
     OR (SELECT pg_catalog.count(*) FROM public.dose_events
         WHERE medication_id = '20000000-0000-4000-8000-000000000001') <> v_events_before THEN
    RAISE EXCEPTION 'Acknowledgement incorrectly recorded dose consumption';
  END IF;
  IF NOT public.escalate_follow_up_task(v_task_id) THEN
    RAISE EXCEPTION 'Task did not escalate to the next authorized caregiver';
  END IF;

  PERFORM pg_catalog.set_config('request.jwt.claim.sub', v_backup::TEXT, true);
  PERFORM pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.jsonb_build_object('sub', v_backup, 'role', 'authenticated')::TEXT,
    true
  );
  IF (SELECT assigned_caregiver_id FROM public.follow_up_tasks WHERE id = v_task_id) <> v_backup THEN
    RAISE EXCEPTION 'Escalation did not reassign the task';
  END IF;
  PERFORM public.resolve_follow_up_task(v_task_id, 'help_required', 'Follow-up complete');
  IF (SELECT status FROM public.follow_up_tasks WHERE id = v_task_id) <> 'resolved' THEN
    RAISE EXCEPTION 'Resolution did not close the task';
  END IF;
  IF (SELECT pg_catalog.count(*) FROM public.dose_events
      WHERE medication_id = '20000000-0000-4000-8000-000000000001') <> v_events_before THEN
    RAISE EXCEPTION 'A non-dose resolution incorrectly changed dose events';
  END IF;

  PERFORM pg_catalog.set_config('request.jwt.claim.sub', v_other_owner::TEXT, true);
  PERFORM pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.jsonb_build_object('sub', v_other_owner, 'role', 'authenticated')::TEXT,
    true
  );
  IF EXISTS (SELECT 1 FROM public.medications WHERE id = '20000000-0000-4000-8000-000000000001') THEN
    RAISE EXCEPTION 'Unrelated profile accessed another elder medication';
  END IF;
  IF pg_catalog.has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE') THEN
    RAISE EXCEPTION 'Authenticated users can change their own role';
  END IF;
  IF pg_catalog.has_table_privilege('authenticated', 'public.follow_up_tasks', 'INSERT') THEN
    RAISE EXCEPTION 'Authenticated users can bypass task RPCs';
  END IF;
  IF pg_catalog.has_table_privilege('authenticated', 'public.care_invites', 'SELECT') THEN
    RAISE EXCEPTION 'Authenticated users can read invitation secrets directly';
  END IF;

  BEGIN
    PERFORM public.accept_care_invite('not-a-valid-invitation-code');
  EXCEPTION WHEN OTHERS THEN
    v_rejected := true;
  END;
  IF NOT v_rejected THEN
    RAISE EXCEPTION 'Invalid invitation code was accepted';
  END IF;
END;
$$;

ROLLBACK;
