import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Plane,
  Hotel,
  Compass,
  MessageSquare,
  FileText,
  DollarSign,
  LogOut,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/flights', label: 'Flights', icon: Plane },
  { to: '/accommodations', label: 'Accommodations', icon: Hotel },
  { to: '/activities', label: 'Activities', icon: Compass },
  { to: '/chat', label: 'AI Chat', icon: MessageSquare },
  { to: '/notes', label: 'Notes', icon: FileText },
  { to: '/budget', label: 'Budget', icon: DollarSign },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed top-0 left-0 h-full w-64 bg-teal-800 text-white flex flex-col z-30 transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-teal-700">
          <div>
            <div className="text-lg font-bold leading-tight">✈️ Trip Planner</div>
            <div className="text-teal-300 text-xs mt-0.5">Montreal → Mauritius</div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded hover:bg-teal-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-teal-600 text-white'
                    : 'text-teal-100 hover:bg-teal-700 hover:text-white'
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User / Logout */}
        <div className="p-4 border-t border-teal-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">{user?.username}</div>
              <div className="text-xs text-teal-300 truncate max-w-[140px]">{user?.email}</div>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-teal-700 text-teal-300 hover:text-white transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
