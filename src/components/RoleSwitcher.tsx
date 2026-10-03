import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ShieldCheck, UserCheck, Gavel, Sparkles } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { role, switchRoleForTesting, isConfigured } = useAuth();

  const roles: { id: UserRole; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'student', label: 'Student', icon: <UserCheck className="w-3.5 h-3.5" />, color: 'hover:border-orange-500' },
    { id: 'judge', label: 'Judge', icon: <Gavel className="w-3.5 h-3.5" />, color: 'hover:border-purple-500' },
    { id: 'admin', label: 'Admin', icon: <ShieldCheck className="w-3.5 h-3.5" />, color: 'hover:border-blue-500' },
  ];

  return (
    <div className="bg-navy-900/90 text-white border border-white/10 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg text-xs">
      <div className="flex items-center gap-1.5 text-gray-300 font-medium">
        <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
        <span className="hidden sm:inline">Active Role:</span>
      </div>

      <div className="flex items-center gap-1 bg-black/30 p-0.5 rounded-full border border-white/5">
        {roles.map((r) => {
          const isActive = role === r.id;
          return (
            <button
              key={r.id}
              onClick={() => switchRoleForTesting(r.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all ${
                isActive
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
              title={`Switch simulation role to ${r.label}`}
            >
              {r.icon}
              <span className="capitalize">{r.label}</span>
            </button>
          );
        })}
      </div>

      {!isConfigured && (
        <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-amber-500/30 hidden md:inline">
          Demo Sandbox
        </span>
      )}
    </div>
  );
};
