export const getAppointmentDoctorLabel = (doctorName: unknown): string =>
  typeof doctorName === 'string' && doctorName.trim()
    ? doctorName.trim()
    : 'Doctor information unavailable';
