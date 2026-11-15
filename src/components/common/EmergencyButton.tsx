import React, { useState } from 'react';
import { PhoneCall, AlertTriangle, X, CheckCircle, ShieldAlert } from 'lucide-react';
import { useCare } from '../../context/CareContext';

interface EmergencyButtonProps {
  compact?: boolean;
}

export const EmergencyButton: React.FC<EmergencyButtonProps> = ({ compact = false }) => {
  const { triggerEmergencyAlert, emergencyAlertActive, dismissEmergencyAlert } = useCare();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTrigger = () => {
    triggerEmergencyAlert();
    setIsModalOpen(true);
  };

  return (
    <>
      <button
        onClick={handleTrigger}
        aria-label="Emergency Help & SOS Alert"
        className={`bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black rounded-2xl shadow-lg border-2 border-rose-500 transition-all flex items-center justify-center cursor-pointer ${
          compact
            ? 'px-3 py-2 text-sm gap-2'
            : 'px-5 py-3 text-base sm:text-lg gap-2.5 animate-pulse-subtle'
        }`}
      >
        <ShieldAlert className={compact ? 'w-4 h-4' : 'w-6 h-6 text-white'} />
        <span>{compact ? 'SOS Help' : 'EMERGENCY SOS'}</span>
      </button>

      {/* Confirmation & Status Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border-4 border-rose-500 shadow-2xl relative text-center">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="w-20 h-20 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <AlertTriangle className="w-12 h-12" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
              Help is on the Way!
            </h2>
            <p className="text-lg text-slate-700 mb-6">
              Your primary caregiver <strong>Sarah Vance</strong> and local on-call response team have been notified with your current home address and medical notes.
            </p>

            <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 mb-6 text-left space-y-2">
              <div className="flex items-center gap-2 text-rose-800 font-bold">
                <CheckCircle className="w-5 h-5 text-rose-600" />
                <span>SMS and Push Dispatch Sent</span>
              </div>
              <div className="flex items-center gap-2 text-rose-800 font-bold">
                <CheckCircle className="w-5 h-5 text-rose-600" />
                <span>GPS Location: 142 Elmwood Ave, Apt 3B</span>
              </div>
              <div className="flex items-center gap-2 text-rose-800 font-bold">
                <PhoneCall className="w-5 h-5 text-rose-600" />
                <span>Auto-calling Sarah: +1 (555) 876-5432</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="tel:911"
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-lg py-3.5 px-4 rounded-2xl inline-flex items-center justify-center gap-2 shadow-md"
              >
                <PhoneCall className="w-6 h-6" />
                <span>Call 911 Directly</span>
              </a>
              <button
                onClick={() => {
                  dismissEmergencyAlert();
                  setIsModalOpen(false);
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base py-3.5 px-4 rounded-2xl"
              >
                I am Safe (Dismiss)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Emergency Top Banner when SOS is active */}
      {emergencyAlertActive && !isModalOpen && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-rose-600 text-white px-4 py-2.5 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-white animate-ping" />
            <span className="font-extrabold text-sm sm:text-base">
              SOS Active: Caregivers alerted. Help is responding.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-xs sm:text-sm bg-white text-rose-700 font-bold px-3 py-1 rounded-lg hover:bg-rose-50"
            >
              View Status
            </button>
            <button
              onClick={dismissEmergencyAlert}
              className="text-xs sm:text-sm bg-rose-800 text-white font-semibold px-2 py-1 rounded-lg hover:bg-rose-900"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </>
  );
};
