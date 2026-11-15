import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  MapPin,
  Phone,
  Video,
  UserCheck,
  Plus,
  Calendar,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useCare } from '../context/CareContext';
import { getAppointmentDoctorLabel } from '../lib/appointments';

export const DoctorAppointmentsPage: React.FC = () => {
  const { appointments, addAppointment, isLoading } = useCare();
  const [showModal, setShowModal] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [clinic, setClinic] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName || !date) return;
    addAppointment({
      doctorName,
      specialty: specialty || 'General Medicine',
      clinic: clinic || 'St. Jude Health Pavilion',
      date,
      time: time || '10:00 AM',
      type: 'in-person',
      status: 'upcoming',
      notes: 'Scheduled via ElderCare Portal. Bring medication list and insurance card.',
      phone: '+1 (555) 443-2211',
      companionAssigned: 'Sarah Vance',
    });
    setShowModal(false);
    setDoctorName('');
    setSpecialty('');
    setDate('');
    setTime('');
    setClinic('');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-700 text-sm font-bold">
            <CalendarDays className="w-5 h-5 text-sky-600" />
            <span>Healthcare Visits & Telehealth</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Doctor Appointments
          </h1>
          <p className="text-base text-slate-600">
            Schedule visits, track medical ride companions, and prepare question lists.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          icon={<Plus className="w-5 h-5" />}
          onClick={() => setShowModal(true)}
        >
          Book Appointment
        </Button>
      </div>

      {/* Appointments Grid */}
      <div className="space-y-6">
        {isLoading ? (
          <p role="status" className="rounded-2xl border border-sky-200 bg-sky-50 p-6 text-sky-900">
            Loading appointments…
          </p>
        ) : appointments.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
            No appointments scheduled yet. Book an appointment to add one.
          </p>
        ) : null}
        {appointments.map((appt) => {
          const isUpcoming = appt.status === 'upcoming';

          return (
            <div
              key={appt.id}
              className={`rounded-3xl border-3 p-6 sm:p-8 shadow-soft transition-all ${
                isUpcoming
                  ? 'bg-white border-sky-300'
                  : 'bg-slate-50/70 border-slate-200 opacity-80'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={isUpcoming ? 'info' : 'neutral'}
                      size="md"
                      icon={appt.type === 'video' ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                    >
                      {appt.type === 'video' ? 'Telehealth Video' : 'In-Person Clinic Visit'}
                    </Badge>

                    <Badge variant={isUpcoming ? 'teal' : 'neutral'} size="sm">
                      {isUpcoming ? 'Confirmed' : 'Completed'}
                    </Badge>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                    {getAppointmentDoctorLabel(appt.doctorName)}
                  </h3>
                  <p className="text-lg font-bold text-sky-800">{appt.specialty}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600 pt-1">
                    <div className="flex items-center gap-2 font-semibold">
                      <Calendar className="w-4 h-4 text-sky-600" />
                      <span>{appt.date}</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold">
                      <Clock className="w-4 h-4 text-sky-600" />
                      <span>{appt.time}</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold col-span-1 sm:col-span-2">
                      <MapPin className="w-4 h-4 text-sky-600" />
                      <span>{appt.clinic}</span>
                    </div>
                  </div>

                  {appt.companionAssigned && (
                    <div className="bg-sky-50 text-sky-900 rounded-xl p-3 text-xs font-bold flex items-center gap-2 border border-sky-200">
                      <UserCheck className="w-4 h-4 text-sky-600" />
                      <span>Assigned Companion: {appt.companionAssigned}</span>
                    </div>
                  )}

                  <p className="text-sm text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                    Notes: "{appt.notes}"
                  </p>
                </div>

                {/* Right Action buttons */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                  <a
                    href={`tel:${appt.phone}`}
                    className="px-5 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Clinic</span>
                  </a>

                  {isUpcoming && (
                    <Button variant="outline" size="md">
                      Sync to Calendar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Book Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border-2 border-sky-500 shadow-2xl space-y-5">
            <h3 className="text-2xl font-black text-slate-900">Book Doctor Appointment</h3>
            <p className="text-sm text-slate-600">
              Add a new medical visit to Eleanor's schedule and notify the family care circle.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Doctor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Robert Chen, MD"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Specialty</label>
                <input
                  type="text"
                  placeholder="e.g. Cardiology, Optometry, Wellness"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 10:30 AM"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Clinic / Hospital</label>
                <input
                  type="text"
                  placeholder="e.g. Mercy Heart & Vascular Center"
                  value={clinic}
                  onChange={(e) => setClinic(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-base"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <Button type="submit" variant="secondary" size="md" fullWidth>
                  Save & Notify Circle
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
