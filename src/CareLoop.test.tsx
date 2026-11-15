import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CareProvider, useCare } from './context/CareContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ElderlyDashboardPage } from './pages/ElderlyDashboardPage';
import { CaregiverDashboardPage } from './pages/CaregiverDashboardPage';
import { MemoryRouter } from 'react-router-dom';

// Test consumer component for verifying direct context workflows
const CareLoopTestHarness: React.FC<{
  onReady: (care: ReturnType<typeof useCare>) => void;
}> = ({ onReady }) => {
  const care = useCare();
  React.useEffect(() => {
    onReady(care);
  }, [care, onReady]);

  return <div data-testid="harness-ready">Harness Ready</div>;
};

const DemoCaregiverLogin: React.FC = () => {
  const { login } = useAuth();
  return <button onClick={() => login('caregiver')}>Enter caregiver demo</button>;
};

describe('CareLoop End-to-End Workflow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('handles dose confirmation from the elderly dashboard', async () => {
    let careInstance: ReturnType<typeof useCare> | null = null;

    render(
      <MemoryRouter>
        <AuthProvider>
          <CareProvider>
            <CareLoopTestHarness onReady={(care) => (careInstance = care)} />
            <ElderlyDashboardPage />
          </CareProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Initial medication should be Metformin (med-2) which is scheduled
    expect(screen.getByText(/Metformin/i)).toBeInTheDocument();

    // Find the large "Taken" button
    const takenButton = screen.getByRole('button', { name: /^taken$/i });
    expect(takenButton).toBeInTheDocument();

    await userEvent.click(takenButton);

    // Verify medication status changed in context
    expect(careInstance).not.toBeNull();
    const updatedMed = careInstance!.medications.find((m) => m.id === 'med-2');
    expect(updatedMed?.status).toBe('taken');
    expect(updatedMed?.lastActionBy).toBe('Eleanor Vance');

    // Verify timeline event recorded
    const timelineEvents = careInstance!.timeline;
    expect(
      timelineEvents.some((e) => e.title.includes('Metformin') && e.title.includes('Taken'))
    ).toBe(true);
  });

  it('handles skipped dose recording with reason', async () => {
    let careInstance: ReturnType<typeof useCare> | null = null;

    render(
      <MemoryRouter>
        <AuthProvider>
          <CareProvider>
            <CareLoopTestHarness onReady={(care) => (careInstance = care)} />
          </CareProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(careInstance).not.toBeNull();

    act(() => {
      careInstance!.recordDoseSkipped(
        'med-2',
        'Feeling mild nausea this morning',
        { name: 'Eleanor Vance', role: 'Care Recipient' }
      );
    });

    const med = careInstance!.medications.find((m) => m.id === 'med-2');
    expect(med?.status).toBe('skipped');
    expect(med?.skippedReason).toBe('Feeling mild nausea this morning');

    // Timeline event
    const skipEvent = careInstance!.timeline.find(
      (e) => e.title.includes('Skipped') && e.title.includes('Metformin')
    );
    expect(skipEvent).toBeDefined();
    expect(skipEvent?.description).toContain('Feeling mild nausea this morning');
  });

  it('detects unconfirmed doses, automatically creates follow-up task and assigns primary caregiver', async () => {
    let careInstance: ReturnType<typeof useCare> | null = null;

    render(
      <MemoryRouter>
        <AuthProvider>
          <CareProvider>
            <CareLoopTestHarness onReady={(care) => (careInstance = care)} />
          </CareProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(careInstance).not.toBeNull();
    expect(careInstance!.followUpTasks.length).toBe(0);

    // Simulate unconfirmed dose for scheduled Metformin
    act(() => {
      careInstance!.simulateUnconfirmedDose('med-2');
    });

    // Medication status becomes unconfirmed
    const med = careInstance!.medications.find((m) => m.id === 'med-2');
    expect(med?.status).toBe('unconfirmed');

    // Follow-up task created
    expect(careInstance!.followUpTasks.length).toBe(1);
    const task = careInstance!.followUpTasks[0];
    expect(task.medicationId).toBe('med-2');
    expect(task.medicationName).toBe('Metformin');
    expect(task.elderlyName).toBe('Eleanor Vance');
    expect(task.assignedCaregiverName).toBe('Sarah Vance');
    expect(task.status).toBe('pending');

    // Timeline alert
    const alertEvent = careInstance!.timeline.find((e) =>
      e.title.includes('Unconfirmed Dose Detected')
    );
    expect(alertEvent).toBeDefined();
    expect(alertEvent?.severity).toBe('attention');
  });

  it('prevents duplicate task creation on repeated unconfirmed dose simulation', async () => {
    let careInstance: ReturnType<typeof useCare> | null = null;

    render(
      <MemoryRouter>
        <AuthProvider>
          <CareProvider>
            <CareLoopTestHarness onReady={(care) => (careInstance = care)} />
          </CareProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(careInstance).not.toBeNull();

    // Trigger twice
    act(() => {
      careInstance!.simulateUnconfirmedDose('med-2');
    });
    expect(careInstance!.followUpTasks.length).toBe(1);

    act(() => {
      careInstance!.simulateUnconfirmedDose('med-2');
    });

    // Still only 1 task for med-2
    expect(careInstance!.followUpTasks.length).toBe(1);
  });

  it('handles caregiver acknowledgement without prematurely marking medication as taken', async () => {
    let careInstance: ReturnType<typeof useCare> | null = null;

    render(
      <MemoryRouter>
        <AuthProvider>
          <DemoCaregiverLogin />
          <CareProvider>
            <CareLoopTestHarness onReady={(care) => (careInstance = care)} />
            <CaregiverDashboardPage />
          </CareProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Enter caregiver demo' }));

    // First create the unconfirmed dose task
    act(() => {
      careInstance!.simulateUnconfirmedDose('med-2');
    });

    // Checkgiver dashboard displays task
    expect(screen.getByText(/Metformin/i)).toBeInTheDocument();
    expect(screen.getByText(/Reason:/i)).toBeInTheDocument();

    const ackButton = screen.getByRole('button', { name: /i'll check on them/i });
    expect(ackButton).toBeInTheDocument();

    await userEvent.click(ackButton);

    // Task status updated to acknowledged
    const task = careInstance!.followUpTasks.find((t) => t.medicationId === 'med-2');
    expect(task?.status).toBe('acknowledged');
    expect(task?.acknowledgedBy).toBe('Sarah Vance');

    // CRITICAL: Medication status MUST remain 'unconfirmed' (NOT 'taken')
    const med = careInstance!.medications.find((m) => m.id === 'med-2');
    expect(med?.status).toBe('unconfirmed');

    // Timeline records acknowledgement
    const ackEvent = careInstance!.timeline.find((e) =>
      e.title.includes('Caregiver Acknowledged')
    );
    expect(ackEvent).toBeDefined();
  });

  it('renders an empty appointment state when no appointments are available', async () => {
    localStorage.setItem('eldercare_careloop_state_v2', JSON.stringify({ appointments: [] }));

    render(
      <MemoryRouter>
        <AuthProvider>
          <DemoCaregiverLogin />
          <CareProvider>
            <CaregiverDashboardPage />
          </CareProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Enter caregiver demo' }));
    expect(screen.getByText('No appointments scheduled.')).toBeInTheDocument();
  });

  it('shows a clear fallback when an appointment has no doctor name', async () => {
    localStorage.setItem(
      'eldercare_careloop_state_v2',
      JSON.stringify({
        appointments: [
          {
            id: 'appointment-without-doctor',
            specialty: 'Cardiology',
            date: '2026-12-01',
            time: '10:00 AM',
            status: 'upcoming',
          },
        ],
      })
    );

    render(
      <MemoryRouter>
        <AuthProvider>
          <DemoCaregiverLogin />
          <CareProvider>
            <CaregiverDashboardPage />
          </CareProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Enter caregiver demo' }));
    expect(screen.getByText('Doctor information unavailable')).toBeInTheDocument();
    expect(screen.getByText('Cardiology')).toBeInTheDocument();
  });

  it('renders valid appointment details from CareContext', async () => {
    localStorage.setItem(
      'eldercare_careloop_state_v2',
      JSON.stringify({
        appointments: [
          {
            id: 'valid-appointment',
            doctorName: 'Dr. Example',
            specialty: 'Cardiology',
            date: '2026-12-01',
            time: '10:00 AM',
            status: 'upcoming',
          },
        ],
      })
    );

    render(
      <MemoryRouter>
        <AuthProvider>
          <DemoCaregiverLogin />
          <CareProvider>
            <CaregiverDashboardPage />
          </CareProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Enter caregiver demo' }));
    expect(screen.getByText('Dr. Example')).toBeInTheDocument();
    expect(screen.getByText('Cardiology')).toBeInTheDocument();
  });

  it('handles escalation to backup caregiver and prevents duplicate escalation alerts', async () => {
    let careInstance: ReturnType<typeof useCare> | null = null;

    render(
      <MemoryRouter>
        <AuthProvider>
          <CareProvider>
            <CareLoopTestHarness onReady={(care) => (careInstance = care)} />
          </CareProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    let taskId = '';
    act(() => {
      const task = careInstance!.simulateUnconfirmedDose('med-2');
      taskId = task!.id;
    });

    // Escalate task
    act(() => {
      careInstance!.escalateFollowUpTask(taskId, true);
    });

    const escalatedTask = careInstance!.followUpTasks.find((t) => t.id === taskId);
    expect(escalatedTask?.status).toBe('escalated');
    expect(escalatedTask?.escalatedToCaregiverName).toBe('Nurse Maria Gomez');

    // Escalation count
    expect(escalatedTask?.escalationCount).toBe(1);

    // Timeline event
    const escalationEvent = careInstance!.timeline.find((e) =>
      e.title.includes('Escalation Notice')
    );
    expect(escalationEvent).toBeDefined();
    expect(escalationEvent?.severity).toBe('critical');

    // Verify duplicate escalation prevention when force is false
    const currentTimelineCount = careInstance!.timeline.length;
    act(() => {
      careInstance!.escalateFollowUpTask(taskId, false);
    });
    expect(careInstance!.timeline.length).toBe(currentTimelineCount);
  });

  it('records caregiver follow-up resolution, separates task status and updates medication status & timeline', async () => {
    let careInstance: ReturnType<typeof useCare> | null = null;

    render(
      <MemoryRouter>
        <AuthProvider>
          <CareProvider>
            <CareLoopTestHarness onReady={(care) => (careInstance = care)} />
          </CareProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    let taskId = '';
    act(() => {
      const task = careInstance!.simulateUnconfirmedDose('med-2');
      taskId = task!.id;
    });

    // Resolve task with verified dose taken
    act(() => {
      careInstance!.resolveFollowUpTask(
        taskId,
        {
          type: 'dose_taken',
          label: 'Dose confirmed taken by elderly person',
          notes: 'Caregiver observed Eleanor taking dose with tea',
        },
        {
          name: 'Sarah Vance',
          role: 'Primary Caregiver',
        }
      );
    });

    // Follow-up task is marked resolved
    const resolvedTask = careInstance!.followUpTasks.find((t) => t.id === taskId);
    expect(resolvedTask?.status).toBe('resolved');
    expect(resolvedTask?.resolution?.type).toBe('dose_taken');
    expect(resolvedTask?.notes).toBe('Caregiver observed Eleanor taking dose with tea');

    // Now medication status is updated to 'taken'
    const med = careInstance!.medications.find((m) => m.id === 'med-2');
    expect(med?.status).toBe('taken');
    expect(med?.lastActionBy).toBe('Sarah Vance');

    // Timeline includes the resolution outcome
    const resolutionEvent = careInstance!.timeline.find((e) =>
      e.title.includes('Follow-Up Resolved')
    );
    expect(resolutionEvent).toBeDefined();
    expect(resolutionEvent?.description).toContain(
      'Caregiver observed Eleanor taking dose with tea'
    );
  });
});
