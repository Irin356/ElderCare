import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseMocks = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: supabaseMocks.from,
  },
}));

import { supabaseCareLoop } from './supabaseCareLoop';

describe('supabaseCareLoop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('surfaces Supabase query errors instead of returning empty care data', async () => {
    const order = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'permission denied by row-level security policy' },
    });
    const select = vi.fn().mockReturnValue({ order });
    supabaseMocks.from.mockReturnValue({ select });

    await expect(supabaseCareLoop.loadCareLoop('user-1', 'caregiver')).rejects.toThrow(
      'Failed to load accessible elder profiles: permission denied by row-level security policy'
    );
    expect(supabaseMocks.from).toHaveBeenCalledWith('elder_profiles');
  });

  it('maps the appointments table doctor_name column to the frontend doctorName field', async () => {
    const queryResult = (data: unknown) => {
      const promise = Promise.resolve({ data, error: null });
      return Object.assign(promise, {
        select: vi.fn(() => promise),
        order: vi.fn(() => promise),
        eq: vi.fn(() => promise),
        gte: vi.fn(() => promise),
        limit: vi.fn(() => promise),
        in: vi.fn(() => promise),
      });
    };

    supabaseMocks.from.mockImplementation((table: string) => {
      if (table === 'elder_profiles') {
        return queryResult([{ id: 'elder-1', user_id: 'user-1', full_name: 'Test Elder' }]);
      }
      if (table === 'appointments') {
        return queryResult([
          {
            id: 'appointment-1',
            doctor_name: 'Dr. Example',
            specialty: 'Cardiology',
            clinic: 'Test Clinic',
            appointment_date: '2026-12-01',
            appointment_time: '10:00:00',
            type: 'in-person',
            status: 'upcoming',
            notes: null,
            phone: null,
          },
        ]);
      }
      return queryResult([]);
    });

    const snapshot = await supabaseCareLoop.loadCareLoop('user-1', 'caregiver');

    expect(snapshot.appointments).toHaveLength(1);
    expect(snapshot.appointments[0].doctorName).toBe('Dr. Example');
  });
});
