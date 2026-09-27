import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Activity, Radio, ExternalLink, LogOut, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { connected } = useSocket();

  return (
    <nav className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
          <Activity size={22} className="animate-pulse" />
        </div>
        <div>
          <span className="font-extrabold text-lg text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">
            StatusPulse
          </span>
          {user && (
            <span className="ml-2 text-xs text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">
              {user.organizationName}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Real-time Connection Indicator */}
        <div className="flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
          <Radio size={14} className={connected ? 'text-emerald-400 animate-pulse' : 'text-rose-400'} />
          <span className={connected ? 'text-emerald-400' : 'text-slate-400'}>
            {connected ? 'Live Sync Active' : 'Connecting...'}
          </span>
        </div>

        {/* Public Status Page Link */}
        {user?.organizationSlug && (
          <Link
            to={`/status/${user.organizationSlug}`}
            target="_blank"
            className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium transition-colors"
          >
            <span>Public Page</span>
            <ExternalLink size={14} />
          </Link>
        )}

        {/* User Info & Logout */}
        {user && (
          <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-200">{user.name}</div>
              <div className="text-[10px] text-slate-400 font-mono">{user.role}</div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
