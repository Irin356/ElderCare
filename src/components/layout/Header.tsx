import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Users,
  User,
  Sparkles,
  Menu,
  X,
  Type,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { EmergencyButton } from '../common/EmergencyButton';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  largeText: boolean;
  onToggleLargeText: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  largeText,
  onToggleLargeText,
}) => {
  const { role, user, switchRole, isDemoMode } = useAuth();

  const isElderly = role === 'elderly';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b-2 border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left: Mobile hamburger & Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 focus:ring-2 focus:ring-teal-500"
              aria-label="Toggle Navigation Menu"
            >
              {isSidebarOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>

            <Link
              to={isElderly ? '/elderly-dashboard' : '/caregiver-dashboard'}
              className="flex items-center gap-3 group select-none"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Heart className="w-7 h-7 fill-white" />
              </div>
              <div>
                <span className="text-2xl font-extrabold tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors">
                  ElderCare
                </span>
                <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-bold uppercase rounded-md bg-teal-100 text-teal-800 tracking-wide">
                  Healthcare 2.0
                </span>
              </div>
            </Link>
          </div>

          {/* Center / Right: Accessibility tools, Role switcher & Emergency button */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* High Contrast / Text Size Toggle for Elderly Accessibility */}
            <button
              onClick={onToggleLargeText}
              title="Toggle Large Accessible Text"
              className={`p-2.5 rounded-2xl border-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                largeText
                  ? 'bg-teal-100 border-teal-500 text-teal-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Type className="w-5 h-5" />
              <span className="text-xs sm:text-sm font-bold hidden md:inline">
                {largeText ? 'Large Text (ON)' : 'Large Text'}
              </span>
            </button>

            {isDemoMode ? (
            <div className="hidden sm:flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-300">
              <button
                onClick={() => switchRole('elderly')}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isElderly
                    ? 'bg-white text-teal-800 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-4 h-4 text-teal-600" />
                <span>Senior View</span>
              </button>
              <button
                onClick={() => switchRole('caregiver')}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  !isElderly
                    ? 'bg-white text-sky-800 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4 text-sky-600" />
                <span>Caregiver View</span>
              </button>
            </div>
            ) : (
              <Link
                to="/profile"
                className="hidden sm:inline-flex px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-100"
              >
                Account
              </Link>
            )}

            {/* Active User Avatar Preview */}
            <div className="hidden lg:flex items-center gap-2.5 pl-2 border-l-2 border-slate-200">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-teal-500 shadow-sm"
              />
              <div className="text-left text-xs">
                <p className="font-extrabold text-slate-900 leading-tight">{user.name}</p>
                <p className="text-slate-500 text-[11px] leading-tight flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-600 inline" />
                  {user.relationship || user.role}
                </p>
              </div>
            </div>

            {/* Emergency SOS button */}
            <EmergencyButton compact={false} />
          </div>
        </div>
      </div>
    </header>
  );
};
