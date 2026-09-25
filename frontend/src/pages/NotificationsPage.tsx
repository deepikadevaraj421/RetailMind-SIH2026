import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, AlertTriangle, Info, CheckCircle2, Settings,
  Check, MoreHorizontal, Bell, Eye, Download, Sparkles
} from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { fetchNotifications, markAllNotificationsRead, updateNotificationStatus } from '../services/api';
import { getSocket } from '../services/socket';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'All' | 'Critical' | 'Warning' | 'Info' | 'Resolved'>('All');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(3);
  const [isLoading, setIsLoading] = useState(true);
  const [markedAllFeedback, setMarkedAllFeedback] = useState(false);

  // Preset list matching Reference Image 3
  const staticPresets = [
    {
      id: 'NTF_01',
      severity: 'Critical',
      category: 'Queue',
      tag2: 'Prediction',
      title: 'Queue congestion predicted at Counter 2',
      message: 'Queue is expected to reach 15 people in 10 minutes based on current trend.',
      time: '10:24 AM',
      status: 'Manager notified',
      statusType: 'critical',
      location: 'Counter 2',
      targetRoute: '/queue',
      imageUrl: 'https://images.unsplash.com/photo-1579113800032-c38bd7635818?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'NTF_02',
      severity: 'Critical',
      category: 'Inventory',
      tag2: 'Out of Stock',
      title: 'Milk – Shelf A3 out of stock',
      message: 'Stock level is 0/10. Replenishment required immediately.',
      time: '10:18 AM',
      status: 'Staff alert sent',
      statusType: 'critical',
      location: 'Shelf A3',
      targetRoute: '/inventory',
      imageUrl: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'NTF_03',
      severity: 'Warning',
      category: 'Inventory',
      tag2: 'Low Stock',
      title: 'Coke 500ml – Low stock',
      message: 'Only 4 units left. Predicted to stock-out in 35 minutes.',
      time: '09:56 AM',
      status: 'Task assigned',
      statusType: 'success',
      location: 'Shelf B2',
      targetRoute: '/inventory',
      imageUrl: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'NTF_04',
      severity: 'Warning',
      category: 'Planogram',
      tag2: 'Misplacement',
      title: 'Planogram issue – Shelf C1',
      message: 'Product misplaced. Please check and correct placement.',
      time: '09:52 AM',
      status: 'Under review',
      statusType: 'warning',
      location: 'Shelf C1',
      targetRoute: '/inventory',
      imageUrl: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'NTF_05',
      severity: 'Info',
      category: 'Inventory',
      tag2: 'Completed',
      title: 'Replenishment completed – Bread',
      message: 'Bread shelf refilled by Staff 03.',
      time: '09:30 AM',
      status: 'Resolved',
      statusType: 'success',
      location: 'Shelf D4',
      targetRoute: '/inventory',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'NTF_06',
      severity: 'Critical',
      category: 'Shopper',
      tag2: 'High Traffic',
      title: 'High customer density in Fruits & Vegetables',
      message: 'Unusually high crowd detected. Consider assigning additional staff.',
      time: '09:15 AM',
      status: 'Manager notified',
      statusType: 'critical',
      location: 'Fruits & Veg',
      targetRoute: '/shoppers',
      imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'NTF_07',
      severity: 'Warning',
      category: 'Queue',
      tag2: 'Performance',
      title: 'Average waiting time increased',
      message: 'Average waiting time is now 6m 40s (+2m 10s from last hour).',
      time: '09:10 AM',
      status: 'Acknowledged',
      statusType: 'success',
      location: 'All Counters',
      targetRoute: '/queue',
      imageUrl: 'https://images.unsplash.com/photo-1554415707-9e4966668834?w=800&auto=format&fit=crop&q=80',
    },
  ];

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchNotifications(50);
      setNotifications(res.data || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Real-time Socket.IO
  useEffect(() => {
    const socket = getSocket();
    const onNewNotif = (notif: any) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
    };
    const onStatus = (s: any) => {
      if (s.unreadNotifications !== undefined) setUnreadCount(s.unreadNotifications);
    };
    socket.on('notification:new', onNewNotif);
    socket.on('system:status', onStatus);
    return () => {
      socket.off('notification:new', onNewNotif);
      socket.off('system:status', onStatus);
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setMarkedAllFeedback(true);
      setTimeout(() => setMarkedAllFeedback(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = () => {
    window.open('/api/reports/notifications/export', '_blank');
  };

  // Filtered notifications list
  const displayList = React.useMemo(() => {
    if (activeFilter === 'All') return staticPresets;
    if (activeFilter === 'Resolved') return staticPresets.filter(n => n.status === 'Resolved');
    return staticPresets.filter(n => n.severity === activeFilter);
  }, [activeFilter]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8faf9] min-h-screen overflow-y-auto">
      {/* Top Bar */}
      <TopBar
        unreadCount={unreadCount}
        lastSyncedText="2 min ago"
        searchValue=""
        onSearchChange={() => {}}
      />

      {/* ── Banner Header matching Reference Image 3 ──────────────────────── */}
      <div className="relative overflow-hidden bg-slate-900 text-white min-h-[150px] flex items-center px-8 py-6">
        {/* Background photo with gradient overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&auto=format&fit=crop&q=80')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Notifications</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-md">
              Stay informed. Take action. Keep your store running smoothly.
            </p>
          </div>

          <div className="text-right hidden md:block">
            <div className="text-sm font-serif italic text-amber-300">
              Better Operations, Brighter Days
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Fresh Shelves • Happy Shoppers • Stronger Business
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Bar matching Reference Image 3 ─────────────────────────── */}
      <div className="px-8 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20">
        {/* Left Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveFilter('All')}
            className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
              activeFilter === 'All'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All (25)
          </button>
          <button
            onClick={() => setActiveFilter('Critical')}
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeFilter === 'Critical'
                ? 'bg-red-600 text-white shadow-2xs'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Critical (4)
          </button>
          <button
            onClick={() => setActiveFilter('Warning')}
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeFilter === 'Warning'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Warning (8)
          </button>
          <button
            onClick={() => setActiveFilter('Info')}
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeFilter === 'Info'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Info (7)
          </button>
          <button
            onClick={() => setActiveFilter('Resolved')}
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeFilter === 'Resolved'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Resolved (6)
          </button>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-slate-700 rounded-lg text-xs font-bold shadow-2xs transition-colors"
          >
            {markedAllFeedback ? '✓ Marked as Read' : 'Mark all as read'}
          </button>
          <button
            onClick={handleExport}
            title="Download CSV Report"
            className="p-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 rounded-lg shadow-2xs"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Main Layout: Left 8 Cols (Feed) & Right 4 Cols (Sidebar) ───────── */}
      <div className="flex-1 p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left 8 Cols: Notifications List */}
          <div className="lg:col-span-8 space-y-3">
            {displayList.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 flex items-center justify-between gap-4 hover:border-slate-300 transition-all"
              >
                {/* Severity Dot / Icon */}
                <div className="shrink-0">
                  <span className={`w-3.5 h-3.5 rounded-full block ${
                    item.severity === 'Critical' ? 'bg-red-500 ring-4 ring-red-100' :
                    item.severity === 'Warning' ? 'bg-amber-500 ring-4 ring-amber-100' :
                    'bg-blue-500 ring-4 ring-blue-100'
                  }`} />
                </div>

                {/* Main Text Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs font-extrabold text-slate-900 tracking-tight">{item.title}</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{item.message}</p>

                  {/* Tag Pills */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                      {item.category}
                    </span>
                    {item.tag2 && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                        {item.tag2}
                      </span>
                    )}
                  </div>
                </div>

                {/* Thumbnail Preview */}
                <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-200 hidden sm:block">
                  <img
                    src={item.imageUrl}
                    alt="Event thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Timestamp & Status Badge */}
                <div className="text-right shrink-0 w-28">
                  <div className="text-[11px] text-slate-400 font-medium">{item.time}</div>
                  <div className="mt-1">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.statusType === 'critical' ? 'bg-red-50 text-red-700 border border-red-200' :
                      item.statusType === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{item.location}</div>
                </div>

                {/* Action View Button */}
                <div className="shrink-0">
                  <button
                    onClick={() => navigate(item.targetRoute)}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 rounded-lg text-xs font-bold transition-all shadow-2xs"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Right 4 Cols: Notification Summary, Recent Activity, Promo Card */}
          <div className="lg:col-span-4 space-y-6">

            {/* 1. Notification Summary */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-extrabold text-slate-900">Notification Summary</h2>
                <select className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                  <option>Today</option>
                  <option>Yesterday</option>
                  <option>Last 7 Days</option>
                </select>
              </div>

              {/* 4 Stat Boxes */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-red-50/70 border border-red-100">
                  <div className="text-lg font-black text-red-700">4</div>
                  <div className="text-[10px] font-bold text-red-600 mt-0.5">Critical</div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                  <div className="text-lg font-black text-amber-700">8</div>
                  <div className="text-[10px] font-bold text-amber-600 mt-0.5">Warning</div>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
                  <div className="text-lg font-black text-blue-700">7</div>
                  <div className="text-[10px] font-bold text-blue-600 mt-0.5">Info</div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <div className="text-lg font-black text-emerald-700">6</div>
                  <div className="text-[10px] font-bold text-emerald-600 mt-0.5">Resolved</div>
                </div>
              </div>
            </div>

            {/* 2. Recent Activity Audit Trail */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
              <h2 className="text-sm font-extrabold text-slate-900 mb-4">Recent Activity</h2>

              <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {[
                  { time: '10:24 AM', text: 'Manager notified about queue congestion', sub: 'Counter 2', color: 'bg-red-500' },
                  { time: '10:18 AM', text: 'Staff alert sent for Milk stock-out', sub: 'Shelf A3', color: 'bg-red-500' },
                  { time: '09:56 AM', text: 'Task assigned for Coke 500ml', sub: 'Shelf B2', color: 'bg-amber-500' },
                  { time: '09:30 AM', text: 'Bread replenishment completed', sub: 'Shelf D4', color: 'bg-blue-500' },
                  { time: '09:15 AM', text: 'Manager notified about high customer density', sub: 'Fruits & Veg', color: 'bg-red-500' },
                ].map((act, idx) => (
                  <div key={idx} className="flex items-start gap-3 relative pl-6">
                    <span className={`w-2.5 h-2.5 rounded-full absolute left-0.5 top-1 ring-4 ring-white ${act.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>{act.time}</span>
                        <span className="font-semibold text-slate-500">{act.sub}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{act.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Stay Ahead Always Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/80 rounded-2xl p-5 flex items-center gap-4 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-xs flex items-center justify-center text-emerald-600 shrink-0">
                <Bell className="w-6 h-6 text-emerald-600 animate-bounce" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-slate-900">Stay Ahead Always</h3>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Get real-time alerts and AI insights to keep your store running smoothly.
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
