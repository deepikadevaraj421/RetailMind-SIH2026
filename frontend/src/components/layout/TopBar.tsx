import React from 'react';
import { Store, Search, Bell, ChevronDown } from 'lucide-react';

interface TopBarProps {
  storeName?: string;
  isOnline?: boolean;
  lastSyncedText?: string;
  unreadCount?: number;
  onSearchChange?: (val: string) => void;
  searchValue?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  storeName = 'Chennai – Anna Nagar',
  isOnline = true,
  lastSyncedText = 'just now',
  unreadCount = 3,
  onSearchChange,
  searchValue = ''
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-20 shrink-0">
      {/* Left: Store Selector & Edge AI Status */}
      <div className="flex items-center space-x-6">
        {/* Store Selector Button */}
        <button className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-800 text-sm font-semibold shadow-sm">
          <Store className="w-4 h-4 text-emerald-600" />
          <span>{storeName}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* Live Status indicator */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="flex items-center space-x-1.5 font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Store Online (Edge AI)</span>
          </span>
          <span className="text-slate-400 hidden sm:inline">• Last synced {lastSyncedText}</span>
        </div>
      </div>

      {/* Right: Global Search, Notification Icon, User Profile */}
      <div className="flex items-center space-x-4">
        {/* Global Search Bar */}
        <div className="relative w-64 md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search camera, product, event..."
            value={searchValue}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full bg-slate-100/80 border border-slate-200 rounded-lg pl-9 pr-14 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-2xs pointer-events-none">
            Ctrl K
          </span>
        </div>

        {/* Notification Bell Icon */}
        <button
          className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          title={`${unreadCount} notifications`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <div className="h-6 w-px bg-slate-200"></div>

        {/* User Profile */}
        <div className="flex items-center space-x-3 cursor-pointer select-none">
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            A
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-slate-800 leading-tight">Store Admin</div>
            <div className="text-[11px] text-slate-500 leading-tight">Store Manager</div>
          </div>
        </div>
      </div>
    </header>
  );
};
