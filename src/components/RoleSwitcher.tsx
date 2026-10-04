import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ShieldCheck, UserCheck, Gavel, Sparkles, HeartHandshake } from 'lucide-react';

interface RoleSwitcherProps {
  onRoleSelected?: (role: UserRole) => void;
  className?: string;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ onRoleSelected, className = '' }) => {
  const { role, switchRoleForTesting } = useAuth();

  const roles: { id: UserRole; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'student', label: 'Student', icon: <UserCheck className="w-3.5 h-3.5" />, color: 'hover:border-orange-500' },
    { id: 'volunteer', label: 'Volunteer', icon: <HeartHandshake className="w-3.5 h-3.5" />, color: 'hover:border-emerald-500' },
    { id: 'judge', label: 'Judge', icon: <Gavel className="w-3.5 h-3.5" />, color: 'hover:border-purple-500' },
    { id: 'admin', label: 'Admin', icon: <ShieldCheck className="w-3.5 h-3.5" />, color: 'hover:border-blue-500' },
  ];

  const handleSelect = (rId: UserRole) => {
    switchRoleForTesting(rId);
    if (onRoleSelected) {
      onRoleSelected(rId);
    }
  };

  return (
    <div className={`bg-navy-950/95 text-white border border-white/15 backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-full flex items-center gap-1.5 sm:gap-2 shadow-xl text-xs ${className}`}>
      <div className="flex items-center gap-1 text-gray-300 font-bold shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
        <span className="hidden md:inline text-[11px] text-gray-300">Persona:</span>
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1 bg-black/40 p-0.5 rounded-full border border-white/10">
        {roles.map((r) => {
          const isActive = role === r.id;
          return (
            <button
              key={r.id}
              onClick={() => handleSelect(r.id)}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full font-bold text-[10px] sm:text-xs transition-all cursor-pointer ${
                isActive
                  ? 'bg-orange-500 text-white shadow-md scale-105'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
              title={`Switch preview role to ${r.label}`}
            >
              {r.icon}
              <span>{r.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

