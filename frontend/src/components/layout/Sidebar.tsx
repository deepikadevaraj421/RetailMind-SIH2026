import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  Users,
  Package,
  Headphones,
  Bell,
  BarChart3,
  Store,
  Settings,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  unreadCount: number;
  lastSyncTime?: string;
}

interface NavItem {
  name: string;
  icon: React.ElementType;
  to: string;
  badge?: number | null;
  active: boolean; // whether this route is implemented
}

export const Sidebar: React.FC<SidebarProps> = ({ unreadCount, lastSyncTime = 'Just now' }) => {
  const navItems: NavItem[] = [
    { name: 'Overview', icon: LayoutDashboard, to: '/overview', active: false, badge: null },
    { name: 'Cameras & Timeline', icon: Video, to: '/cameras', active: true, badge: null },
    { name: 'Shoppers & Analytics', icon: Users, to: '/shoppers', active: true, badge: null },
    { name: 'Inventory & Shelves', icon: Package, to: '/inventory', active: true, badge: null },
    { name: 'Queue & Predictions', icon: Headphones, to: '/queue', active: true, badge: null },
    { name: 'Notifications', icon: Bell, to: '/notifications', active: true, badge: unreadCount > 0 ? unreadCount : null },
    { name: 'Reports', icon: BarChart3, to: '/reports', active: true, badge: null },
    { name: 'Multi-Store', icon: Store, to: '/multi-store', active: true, badge: null },
    { name: 'Settings', icon: Settings, to: '/settings', active: true, badge: null },
  ];

  return (
    <aside className="w-64 bg-[#0A101F] text-slate-300 flex flex-col justify-between shrink-0 min-h-screen border-r border-slate-800 select-none">
      {/* Top Branding & Navigation */}
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-950">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-lg text-white tracking-tight">RetailMind</span>
            </div>
            <p className="text-[11px] text-emerald-400/90 font-medium tracking-tight">Smarter Stores. Happier People.</p>
          </div>
        </div>

        {/* Nav List */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            if (item.active) {
              return (
                <NavLink
                  key={item.name}
                  to={item.to}
                  className={({ isActive }) =>
                    `w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-[#16A34A] text-white shadow-md shadow-green-950/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge !== null && item.badge !== undefined && (
                    <span className="bg-red-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            }

            return (
              <button
                key={item.name}
                disabled
                title="Available in future phase"
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-slate-500 text-sm font-medium opacity-60 cursor-not-allowed group"
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span>{item.name}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span className="bg-red-500/70 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Status & Footer */}
      <div className="p-4 space-y-3 border-t border-slate-800/80">
        {/* Edge AI Status Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse-subtle"></span>
            <span className="text-xs font-semibold text-white">Edge AI Connected</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">All systems running</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Last sync: {lastSyncTime}</p>
        </div>

        {/* Privacy Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5 flex items-center space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <div className="text-[11px] font-semibold text-slate-200">Privacy Protected</div>
            <div className="text-[10px] text-slate-400">Anonymous analytics only</div>
          </div>
        </div>

        {/* Version & Made in India */}
        <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
          <span>RetailMind v1.0.0</span>
          <span className="flex items-center space-x-1" title="Proudly built for Indian Supermarkets">
            <span>Built in India</span>
            <span>🇮🇳</span>
          </span>
        </div>
      </div>
    </aside>
  );
};
