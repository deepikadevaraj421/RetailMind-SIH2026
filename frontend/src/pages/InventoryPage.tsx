import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, AlertTriangle, Clock, Grid, ShoppingCart, ArrowUp, ArrowDown,
  Download, Send, CheckCircle2, ChevronRight, Eye, RefreshCw, X,
  Layers, ShieldAlert, Check, HelpCircle
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TopBar } from '../components/layout/TopBar';
import {
  fetchInventorySummary, fetchInventoryHealth, fetchInventoryCategories,
  fetchInventoryAlerts, fetchInventoryShelfCameras, fetchInventoryAtRisk,
  fetchInventoryShelfDetail, fetchInventoryPlanogram, fetchInventoryReplenishment,
  notifyStaffForShelf, assignReplenishmentTask
} from '../services/api';
import { getSocket } from '../services/socket';

export const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Shelf View' | 'Product View' | 'Planogram' | 'Replenishment' | 'Stock Alerts'>('Overview');
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(3);

  // Data states
  const [summary, setSummary] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [shelfCameras, setShelfCameras] = useState<any[]>([]);
  const [atRisk, setAtRisk] = useState<any[]>([]);
  const [shelfDetail, setShelfDetail] = useState<any>(null);
  const [planogram, setPlanogram] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);

  // Action states
  const [staffNotified, setStaffNotified] = useState(false);
  const [selectedShelfId, setSelectedShelfId] = useState('A3');

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sum, h, cats, alts, cams, risk, detail, plano, rep] = await Promise.all([
        fetchInventorySummary(),
        fetchInventoryHealth(),
        fetchInventoryCategories(),
        fetchInventoryAlerts(),
        fetchInventoryShelfCameras(),
        fetchInventoryAtRisk(),
        fetchInventoryShelfDetail(selectedShelfId),
        fetchInventoryPlanogram(),
        fetchInventoryReplenishment(),
      ]);
      setSummary(sum);
      setHealth(h);
      setCategories(cats || []);
      setAlerts(alts || []);
      setShelfCameras(cams || []);
      setAtRisk(risk || []);
      setShelfDetail(detail);
      setPlanogram(plano);
      setTasks(rep || []);
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedShelfId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Real-time socket events
  useEffect(() => {
    const socket = getSocket();
    const onStatus = (s: any) => {
      if (s.unreadNotifications !== undefined) setUnreadCount(s.unreadNotifications);
    };
    const onNotif = () => {
      setUnreadCount(prev => prev + 1);
    };
    socket.on('system:status', onStatus);
    socket.on('notification:new', onNotif);
    return () => {
      socket.off('system:status', onStatus);
      socket.off('notification:new', onNotif);
    };
  }, []);

  const handleNotifyStaff = async () => {
    try {
      await notifyStaffForShelf(selectedShelfId, 'Staff dispatched to refill shelf.');
      setStaffNotified(true);
      setTimeout(() => setStaffNotified(false), 5000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignTask = async (taskId: string) => {
    try {
      await assignReplenishmentTask(taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Assigned', action: 'View' } : t));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadReport = () => {
    window.open('/api/reports/inventory/export', '_blank');
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8faf9] min-h-screen overflow-y-auto">
      {/* Top Bar */}
      <TopBar
        unreadCount={unreadCount}
        lastSyncedText="2 min ago"
        searchValue=""
        onSearchChange={() => {}}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-6 bg-white border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            Inventory &amp; Shelves
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time inventory visibility and shelf compliance using AI.
          </p>
        </div>

        {/* Download Report Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadAll}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="px-6 py-2.5 bg-white border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
        {(['Overview', 'Shelf View', 'Product View', 'Planogram', 'Replenishment', 'Stock Alerts'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 space-y-5">

        {/* ── ROW 1: 5 Top KPI Cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* 1. Inventory Availability */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Availability</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900">
                {summary?.inventoryAvailabilityPct ?? 94.2}%
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-0.5">
                <ArrowUp className="w-3 h-3" />
                <span>+{summary?.availabilityChangePct ?? 2.1}% vs. last week</span>
              </div>
            </div>
          </div>

          {/* 2. Out of Stock */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Out of Stock</span>
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900">
                {summary?.outOfStockCount ?? 3} <span className="text-xs font-normal text-slate-400">products</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-red-600 mt-0.5">
                <ArrowUp className="w-3 h-3" />
                <span>+{summary?.outOfStockChange ?? 1}</span>
              </div>
            </div>
          </div>

          {/* 3. Low Stock */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Low Stock</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900">
                {summary?.lowStockCount ?? 12} <span className="text-xs font-normal text-slate-400">products</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-0.5">
                <ArrowDown className="w-3 h-3" />
                <span>{summary?.lowStockChange ?? -4}</span>
              </div>
            </div>
          </div>

          {/* 4. Planogram Compliance */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Planogram</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Grid className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900">
                {summary?.planogramCompliancePct ?? 92}%
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-0.5">
                <ArrowUp className="w-3 h-3" />
                <span>+{summary?.planogramChangePct ?? 6}%</span>
              </div>
            </div>
          </div>

          {/* 5. Replenishment Pending */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Replenishment</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <div className="text-2xl font-black text-slate-900">
                  {summary?.replenishmentPendingCount ?? 8} <span className="text-xs font-normal text-slate-400">tasks</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* ── ROW 2: Shelf Health, Stock by Category, Recent Alerts ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* 1. Shelf Health Overview */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
            <h2 className="text-sm font-extrabold text-slate-900 mb-4">Shelf Health Overview</h2>
            <div className="flex items-center justify-center mb-4">
              {/* Donut Gauge */}
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                  <circle
                    cx="50" cy="50" r="40" fill="none" stroke="#16a34a" strokeWidth="10"
                    strokeDasharray="251.2" strokeDashoffset="50" strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-slate-900">86<span className="text-xs text-slate-400 font-normal"> / 100</span></span>
                  <span className="text-[11px] font-bold text-emerald-600">Good</span>
                </div>
              </div>
            </div>
            <div className="space-y-2.5 text-xs font-semibold">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Healthy
                </span>
                <span className="text-slate-900 font-bold">68 (72%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Needs Attention
                </span>
                <span className="text-slate-900 font-bold">18 (19%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  Critical
                </span>
                <span className="text-slate-900 font-bold">8 (9%)</span>
              </div>
            </div>
          </div>

          {/* 2. Stock Status by Category */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-extrabold text-slate-900">Stock Status by Category</h2>
              <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600" /> Available</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Low</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Out</span>
              </div>
            </div>
            <div className="flex-1" style={{ minHeight: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categories} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                  />
                  <Bar dataKey="available" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} barSize={18} />
                  <Bar dataKey="lowStock" stackId="a" fill="#f59e0b" barSize={18} />
                  <Bar dataKey="outOfStock" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Recent Alerts */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-extrabold text-slate-900">Recent Alerts</h2>
              <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700">View All</button>
            </div>
            <div className="space-y-2.5 divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[280px]">
              {alerts.map((alert) => (
                <div key={alert.id} className="pt-2.5 first:pt-0 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                      alert.severity === 'Critical' ? 'bg-red-500' :
                      alert.severity === 'Warning' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{alert.title}</h4>
                      <p className="text-[11px] text-slate-500">{alert.description}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-slate-400">{alert.time}</div>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${alert.badgeColor}`}>
                      {alert.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ROW 3: Live Shelf Cameras + At-Risk Products + Shelf Detail ──── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* 1. Live Shelf Cameras — FIXED: constrained image sizes */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-extrabold text-slate-900">Live Shelf Cameras</h2>
              <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700">View All</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {shelfCameras.map((cam, idx) => {
                const shelfId = cam.cameraName.includes('A3') ? 'A3' : (cam.cameraName.includes('B2') ? 'B2' : 'C1');
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedShelfId(shelfId)}
                    className={`relative rounded-lg overflow-hidden cursor-pointer group border transition-all ${
                      selectedShelfId === shelfId
                        ? 'ring-2 ring-emerald-500 border-emerald-500'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Fixed height image container */}
                    <div className="relative w-full h-24 bg-slate-800">
                      <img
                        src={cam.imageUrl}
                        alt={cam.cameraName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-1 left-1">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold text-white shadow-sm ${cam.badgeColor}`}>
                          {cam.status}
                        </span>
                      </div>
                    </div>
                    <div className="p-1.5 bg-white">
                      <div className="text-[10px] font-extrabold text-slate-900 truncate">{cam.cameraName}</div>
                      <div className="text-[9px] text-slate-400 font-medium">{cam.product}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Top At-Risk Products */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-extrabold text-slate-900">Top At-Risk Products</h2>
              <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700">View All</button>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] text-slate-400 font-bold uppercase">
                    <th className="pb-2">Product</th>
                    <th className="pb-2">Shelf</th>
                    <th className="pb-2">Stock</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {atRisk.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="py-2.5 font-bold text-slate-900">{item.product}</td>
                      <td className="py-2.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                          {item.shelf}
                        </span>
                      </td>
                      <td className="py-2.5 font-bold text-slate-800">{item.current} / {item.expected}</td>
                      <td className="py-2.5 text-right">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                          item.status === 'Out of Stock' ? 'text-red-600' : 'text-amber-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'Out of Stock' ? 'bg-red-500' : 'bg-amber-500'}`} />
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Shelf Detail Panel — FIXED: constrained image height */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-extrabold text-slate-900">Shelf Detail – {selectedShelfId}</h2>
              <button
                onClick={() => setSelectedShelfId('A3')}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo preview — constrained to fixed height */}
            <div className="relative rounded-lg overflow-hidden bg-slate-800 mb-3" style={{ height: '120px' }}>
              <img
                src={shelfDetail?.imageUrl || 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80'}
                alt="Shelf detail"
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-600 text-white shadow-sm">
                {shelfDetail?.status || 'Out of Stock'}
              </span>
            </div>

            {/* Title & SKU */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">{shelfDetail?.product || 'Milk (1L)'}</h3>
                <p className="text-[10px] text-slate-400 font-mono">SKU: {shelfDetail?.sku || 'MILK001'}</p>
              </div>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">
                {shelfDetail?.category || 'Dairy'}
              </span>
            </div>

            {/* Properties list */}
            <div className="space-y-1 text-xs flex-1">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Current Stock</span>
                <span className="font-extrabold text-slate-900">{shelfDetail?.currentStock ?? 0} / {shelfDetail?.expectedStock ?? 10}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Predicted Stock-out</span>
                <span className="font-bold text-red-600">{shelfDetail?.predictedStockout || 'Already out'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Planogram Status</span>
                <span className="font-bold text-red-600">{shelfDetail?.planogramStatus || '1 misplaced'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Shelf Health</span>
                <span className="font-extrabold text-slate-900">{shelfDetail?.shelfHealthScore ?? 28} / 100</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Last Updated</span>
                <span className="text-slate-600">{shelfDetail?.lastUpdated || '10:24 AM'}</span>
              </div>
            </div>

            {/* Notify Staff Action */}
            <div className="mt-3 pt-3 border-t border-slate-100">
              <button
                onClick={handleNotifyStaff}
                className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold shadow-sm transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Notify Staff</span>
              </button>

              {staffNotified && (
                <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-emerald-800 font-semibold">
                    <div>Alert sent to store staff</div>
                    <div className="text-[10px] text-emerald-600 font-normal">Staff will refill Shelf {selectedShelfId}.</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── ROW 4: Planogram Compliance & Replenishment Tasks ───────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* 1. Planogram Compliance */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
            <h2 className="text-sm font-extrabold text-slate-900 mb-3">Planogram Compliance</h2>
            <div className="flex items-center gap-5">
              {/* Circular Gauge */}
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                  <circle
                    cx="50" cy="50" r="40" fill="none" stroke="#16a34a" strokeWidth="10"
                    strokeDasharray="251.2" strokeDashoffset="20" strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-black text-slate-900">{planogram?.compliancePct ?? 92}%</span>
                  <span className="text-[9px] font-bold text-emerald-600">Compliant</span>
                </div>
              </div>

              {/* Issues summary */}
              <div className="flex-1 space-y-1.5 text-xs">
                <div className="text-xs font-bold text-red-600 flex items-center justify-between">
                  <span>{planogram?.shelvesWithIssues ?? 7} shelves with issues</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
                <div className="text-slate-600 flex justify-between">
                  <span>Misplaced</span>
                  <span className="font-bold text-slate-900">{planogram?.misplacedCount ?? 4}</span>
                </div>
                <div className="text-slate-600 flex justify-between">
                  <span>Missing</span>
                  <span className="font-bold text-slate-900">{planogram?.missingCount ?? 2}</span>
                </div>
                <div className="text-slate-600 flex justify-between">
                  <span>Extra</span>
                  <span className="font-bold text-slate-900">{planogram?.extraCount ?? 1}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Replenishment Tasks — spans 2 cols */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-extrabold text-slate-900">Replenishment Tasks</h2>
              <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700">View All</button>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] text-slate-400 font-bold uppercase">
                    <th className="pb-2">Product</th>
                    <th className="pb-2">Shelf</th>
                    <th className="pb-2">Priority</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 font-bold text-slate-900">{task.product}</td>
                      <td className="py-2.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                          {task.shelf}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          task.priority === 'High' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          task.status === 'Assigned'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        {task.status === 'Pending' ? (
                          <button
                            onClick={() => handleAssignTask(task.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                          >
                            Assign
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedShelfId(task.shelf)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
