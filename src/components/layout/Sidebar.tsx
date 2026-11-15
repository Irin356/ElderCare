import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  ShieldAlert,
  Pill,
  CheckSquare,
  Users2,
  Mic2,
  AudioWaveform,
  CalendarDays,
  History,
  LogIn,
  HeartHandshake,
  Sparkles,
  UserCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCare } from '../../context/CareContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  to: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  description: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { role, isDemoMode } = useAuth();
  const { medications, followUpTasks } = useCare();
  const isElderly = role === 'elderly';

  const navItems: NavItem[] = [
    {
      name: 'Elderly Dashboard',
      to: '/elderly-dashboard',
      icon: <Home className="w-6 h-6" />,
      badge: isElderly ? 'Active View' : undefined,
      badgeColor: 'bg-teal-100 text-teal-800',
      description: 'Senior simple one-tap daily view',
    },
    {
      name: 'Caregiver Dashboard',
      to: '/caregiver-dashboard',
      icon: <LayoutDashboard className="w-6 h-6" />,
      badge: !isElderly ? 'Active View' : undefined,
      badgeColor: 'bg-sky-100 text-sky-800',
      description: 'Family & vitals overview',
    },
    {
      name: 'Medications',
      to: '/medications',
      icon: <Pill className="w-6 h-6" />,
      badge: isDemoMode ? `${medications.length} Today` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
      description: 'Pill reminders with big photo guides',
    },
    {
      name: 'CareLoop',
      to: '/care-loop',
      icon: <CheckSquare className="w-6 h-6" />,
      badge: isDemoMode ? `${followUpTasks.filter((task) => task.status !== 'resolved').length} Pending` : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800',
      description: 'Daily routine, hydration & vitals loop',
    },
    {
      name: 'CareCircle',
      to: '/care-circle',
      icon: <Users2 className="w-6 h-6" />,
      description: 'Family, neighbors & visiting nurses',
    },
    {
      name: 'VoiceCare',
      to: '/voice-care',
      icon: <Mic2 className="w-6 h-6" />,
      badge: 'AI Active',
      badgeColor: 'bg-teal-100 text-teal-800',
      description: 'Conversational voice check-in agent',
    },
    {
      name: 'Familiar Voice Studio',
      to: '/voice-studio',
      icon: <AudioWaveform className="w-6 h-6" />,
      badge: 'AI Cloned',
      badgeColor: 'bg-purple-100 text-purple-800',
      description: 'Family voice clone reminders',
    },
    {
      name: 'Doctor Appointments',
      to: '/appointments',
      icon: <CalendarDays className="w-6 h-6" />,
      badge: 'Nov 20',
      badgeColor: 'bg-blue-100 text-blue-800',
      description: 'Physician visits & telehealth rides',
    },
    {
      name: 'Shared Care Timeline',
      to: '/timeline',
      icon: <History className="w-6 h-6" />,
      description: 'Unified family care journal',
    },
  ];

  const metaItems = [
    {
      name: 'My Profile',
      to: '/profile',
      icon: <UserCircle className="w-5 h-5" />,
      description: 'Account details',
    },
    {
      name: 'Welcome Page',
      to: '/welcome',
      icon: <HeartHandshake className="w-5 h-5" />,
      description: 'Platform overview & intro',
    },
    {
      name: 'Login / Switch Account',
      to: '/login',
      icon: <LogIn className="w-5 h-5" />,
      description: 'Authentication & role selection',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-20 bottom-0 left-0 z-30 w-72 sm:w-80 bg-white border-r-2 border-slate-200 overflow-y-auto transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-6">
          {/* Quick status banner */}
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-4 border border-teal-200">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                {isDemoMode ? 'Demo Care Status' : 'Private Care Workspace'}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {isDemoMode
                ? 'Sample data only. Do not rely on demo reminders for medication.'
                : 'Only profiles shared with your account are available here.'}
            </p>
          </div>

          {/* Core Navigation Section */}
          <div>
            <p className="px-3 text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              Primary Care Navigation
            </p>
            <nav className="space-y-1.5" aria-label="Main Navigation">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between p-3 rounded-2xl transition-all duration-150 group ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-md font-bold'
                        : 'text-slate-700 hover:bg-slate-100 font-semibold'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <span
                          className={`${
                            isActive
                              ? 'text-white'
                              : 'text-teal-600 group-hover:text-teal-700'
                          }`}
                        >
                          {item.icon}
                        </span>
                        <div>
                          <div className="text-base leading-tight">{item.name}</div>
                          <div
                            className={`text-xs ${
                              isActive ? 'text-teal-100' : 'text-slate-400'
                            }`}
                          >
                            {item.description}
                          </div>
                        </div>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold ml-2 ${
                            isActive ? 'bg-white text-teal-800' : item.badgeColor
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Account & Welcome Section */}
          <div className="pt-4 border-t-2 border-slate-100">
            <p className="px-3 text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              Account & Portal
            </p>
            <div className="space-y-1">
              {metaItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 p-2.5 rounded-2xl text-sm font-bold transition-colors ${
                      isActive
                        ? 'bg-slate-200 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  <span className="text-slate-500">{item.icon}</span>
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </div>
          </div>

          {/* Quick SOS Card in Sidebar */}
          <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 text-center">
            <ShieldAlert className="w-8 h-8 text-rose-600 mx-auto mb-2" />
            <h4 className="text-sm font-extrabold text-rose-900">Immediate Assistance</h4>
            <p className="text-xs text-rose-700 mt-1 mb-3">
              One tap dispatches family and medical alerts with live audio.
            </p>
            <a
              href="tel:911"
              className="block w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow"
            >
              Call 911 Direct
            </a>
          </div>
        </div>
      </aside>
    </>
  );
};
