import React, { useState, useEffect, useMemo } from 'react';
import {
  Store, Wifi, Users, AlertTriangle, ChevronDown, Search,
  ArrowUp, ArrowDown, MapPin, Eye, Plus, Minus, ExternalLink,
  CheckCircle2, AlertCircle, Clock, ShieldCheck, Activity,
  Sparkles, Check, ChevronRight, Layers, Building
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  fetchMultiStoreSummary, fetchMultiStorePerformance,
  fetchMultiStoreFootfall, fetchMultiStoreAttention,
  fetchMultiStoreHealth, fetchMultiStoreInsights,
  fetchMultiStoreActivity
} from '../services/api';

export const MultiStorePage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [footfallData, setFootfallData] = useState<any[]>([]);
  const [footfallPeriod, setFootfallPeriod] = useState('Today');
  const [attentionStores, setAttentionStores] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('All Regions');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [perfFilter, setPerfFilter] = useState('All Performance');

  // Selected Store for Map highlight
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [mapZoom, setMapZoom] = useState(1);

  // Load all data
  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);
        const [sum, perf, ff, att, hlth, ins, act] = await Promise.all([
          fetchMultiStoreSummary().catch(() => null),
          fetchMultiStorePerformance().catch(() => []),
          fetchMultiStoreFootfall(footfallPeriod).catch(() => []),
          fetchMultiStoreAttention().catch(() => []),
          fetchMultiStoreHealth().catch(() => null),
          fetchMultiStoreInsights().catch(() => []),
          fetchMultiStoreActivity().catch(() => [])
        ]);

        if (sum) setSummary(sum);
        if (perf && perf.length > 0) {
          setStores(perf);
          setSelectedStore(perf[0]);
        }
        if (ff) setFootfallData(ff);
        if (att) setAttentionStores(att);
        if (hlth) setHealthData(hlth);
        if (ins) setAiInsights(ins);
        if (act) setRecentActivity(act);
      } catch (err) {
        console.error('Error loading multi-store data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  // Update footfall on period change
  const handlePeriodChange = async (period: string) => {
    setFootfallPeriod(period);
    try {
      const data = await fetchMultiStoreFootfall(period);
      if (data) setFootfallData(data);
    } catch (e) {}
  };

  // Filter stores
  const filteredStores = useMemo(() => {
    return stores.filter(s => {
      const matchesSearch = !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.city.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRegion = regionFilter === 'All Regions' ||
        s.region.toLowerCase() === regionFilter.toLowerCase() ||
        s.city.toLowerCase() === regionFilter.toLowerCase();

      const matchesStatus = statusFilter === 'All Status' ||
        s.status.toLowerCase() === statusFilter.toLowerCase();

      let matchesPerf = true;
      if (perfFilter === 'Excellent') matchesPerf = s.storeHealth >= 90;
      else if (perfFilter === 'Good') matchesPerf = s.storeHealth >= 80 && s.storeHealth < 90;
      else if (perfFilter === 'Needs Attention') matchesPerf = s.storeHealth > 0 && s.storeHealth < 80;

      return matchesSearch && matchesRegion && matchesStatus && matchesPerf;
    });
  }, [stores, searchQuery, regionFilter, statusFilter, perfFilter]);

  if (loading && !summary) {
    return (
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAF9] min-h-screen p-8 space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-lg w-72"></div>
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-white rounded-xl"></div>)}
        </div>
        <div className="h-96 bg-white rounded-xl"></div>
      </div>
    );
  }

  // Tamil Nadu Map Cities
  const MAP_CITIES = [
    { name: 'Chennai', x: 260, y: 55, count: '2 stores', storeId: 'STORE001' },
    { name: 'Salem', x: 175, y: 125, count: '1 store', storeId: 'STORE004' },
    { name: 'Coimbatore', x: 105, y: 170, count: '2 stores', storeId: 'STORE002' },
    { name: 'Trichy', x: 195, y: 175, count: '2 stores', storeId: 'STORE005' },
    { name: 'Madurai', x: 165, y: 225, count: '2 stores', storeId: 'STORE003' },
    { name: 'Tirunelveli', x: 140, y: 285, count: '1 store', storeId: 'STORE006' },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAF9] min-h-screen overflow-y-auto font-sans text-[#0F172A]">

      {/* ── Top Bar matching screenshot ───────────────────────────────────────── */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-20 shrink-0 select-none">
        {/* Left: Region Selector & All Stores Online status */}
        <div className="flex items-center space-x-5">
          <button className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-800 text-xs font-semibold shadow-xs">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>Tamil Nadu (All Stores)</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          <div className="flex items-center space-x-2 text-xs">
            <span className="flex items-center space-x-1.5 font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>All Stores Online (11/12)</span>
            </span>
            <span className="text-slate-400 hidden sm:inline">• Last synced 2 min ago</span>
          </div>
        </div>

        {/* Right: Search, Calendar, Notifications, Profile */}
        <div className="flex items-center space-x-4">
          <div className="relative w-64 md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search store, camera, product, report..."
              className="w-full bg-slate-100/80 border border-slate-200 rounded-lg pl-9 pr-14 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-2xs pointer-events-none">
              Ctrl K
            </span>
          </div>

          {/* Date Picker */}
          <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700">
            <span>📅 Today, 14 Sep 2026</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Notification bell */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <span className="text-base">🔔</span>
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              5
            </span>
          </button>

          <div className="h-6 w-px bg-slate-200"></div>

          {/* Admin Profile */}
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              A
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">Store Admin</div>
              <div className="text-[10px] text-slate-500 leading-tight">Head Office</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Page Header Area with Supermarket Banner ─────────────────────────── */}
      <div className="px-7 pt-6 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Multi-Store</h1>
            <p className="text-xs text-slate-500 mt-1">Monitor and compare all your stores from one place.</p>
          </div>

          {/* Banner Graphic on Right */}
          <div className="relative overflow-hidden rounded-xl h-20 w-full lg:w-[480px] shadow-xs border border-slate-200 bg-slate-900 shrink-0">
            <img
              src="https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80"
              alt="Multi-Store Banner"
              className="w-full h-full object-cover opacity-60 filter brightness-95"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/60 flex items-center justify-end px-6">
              <div className="text-right">
                <div className="text-white/95 font-serif italic text-base leading-tight drop-shadow tracking-wide">
                  Multiple Stores
                </div>
                <div className="text-white/95 font-serif italic text-base leading-tight drop-shadow tracking-wide flex items-center justify-end gap-1">
                  <span>Stronger Together</span>
                  <span className="text-emerald-400 not-italic text-sm">🍃</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 5 KPI Summary Cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-5">

          {/* KPI 1: Total Stores */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex items-center gap-3.5 hover:border-slate-300 transition-colors">
            <div className="w-11 h-11 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Total Stores</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-2xl font-extrabold text-slate-900">{summary?.totalStores || 12}</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  <ArrowUp className="w-3 h-3" /> 1
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Across 4 cities</span>
            </div>
          </div>

          {/* KPI 2: Stores Online */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex items-center gap-3.5 hover:border-slate-300 transition-colors">
            <div className="w-11 h-11 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center shrink-0">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Stores Online</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-2xl font-extrabold text-slate-900">{summary?.storesOnline || 11}</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  <ArrowUp className="w-3 h-3" /> 1
                </span>
              </div>
              <span className="text-[11px] text-slate-400">91.7% online</span>
            </div>
          </div>

          {/* KPI 3: Total Footfall Today */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex items-center gap-3.5 hover:border-slate-300 transition-colors">
            <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Total Footfall Today</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-2xl font-extrabold text-slate-900">
                  {summary?.totalFootfallToday ? summary.totalFootfallToday.toLocaleString() : '18,642'}
                </span>
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  <ArrowUp className="w-3 h-3" /> 12%
                </span>
              </div>
              <span className="text-[11px] text-slate-400">vs. yesterday (16,624)</span>
            </div>
          </div>

          {/* KPI 4: Active Alerts */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex items-center gap-3.5 hover:border-slate-300 transition-colors">
            <div className="w-11 h-11 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Active Alerts</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-2xl font-extrabold text-slate-900">{summary?.activeAlerts || 23}</span>
                <span className="text-xs font-bold text-red-600 flex items-center">
                  <ArrowUp className="w-3 h-3" /> 6
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Across 5 stores</span>
            </div>
          </div>

          {/* KPI 5: Stores Needing Attention */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex items-center gap-3.5 hover:border-slate-300 transition-colors">
            <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Stores Needing Attention</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-2xl font-extrabold text-slate-900">{summary?.storesNeedingAttention || 3}</span>
                <span className="text-xs font-bold text-red-600 flex items-center">
                  <ArrowUp className="w-3 h-3" /> 1
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Require immediate action</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── Main Middle Section: Table & Map Split ────────────────────────────── */}
      <div className="px-7 py-2 grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Left: Store Performance Table (~68% width -> col-span-8) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
              <h2 className="text-base font-bold text-slate-900">Store Performance</h2>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Search input */}
                <div className="relative w-44">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search stores..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#16A34A]"
                  />
                </div>

                {/* Region Filter */}
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
                >
                  <option value="All Regions">All Regions</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Coimbatore">Coimbatore</option>
                  <option value="Madurai">Madurai</option>
                  <option value="Salem">Salem</option>
                  <option value="Trichy">Trichy</option>
                  <option value="Tirunelveli">Tirunelveli</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
                >
                  <option value="All Status">All Status</option>
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                </select>

                {/* Performance Filter */}
                <select
                  value={perfFilter}
                  onChange={(e) => setPerfFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
                >
                  <option value="All Performance">All Performance</option>
                  <option value="Excellent">Excellent (&ge;90)</option>
                  <option value="Good">Good (80-89)</option>
                  <option value="Needs Attention">Needs Attention (&lt;80)</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 text-slate-400 font-medium">
                  <tr>
                    <th className="pb-2.5 pl-1 font-medium">Store</th>
                    <th className="pb-2.5 font-medium">Status</th>
                    <th className="pb-2.5 font-medium">Footfall Today</th>
                    <th className="pb-2.5 font-medium">Inventory Availability</th>
                    <th className="pb-2.5 font-medium">Avg Queue</th>
                    <th className="pb-2.5 font-medium">Avg Wait Time</th>
                    <th className="pb-2.5 font-medium text-center">Store Health</th>
                    <th className="pb-2.5 font-medium text-center">Alerts</th>
                    <th className="pb-2.5 font-medium text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStores.map(st => {
                    const isSelected = selectedStore?.storeId === st.storeId;
                    return (
                      <tr
                        key={st.storeId}
                        onClick={() => setSelectedStore(st)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-emerald-50/60' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Store info with thumbnail */}
                        <td className="py-3 pl-1">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={st.imageUrl}
                              alt={st.name}
                              className="w-8 h-8 rounded-md object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-slate-900 leading-tight">{st.name}</div>
                              <div className="text-[11px] text-slate-400">{st.city}</div>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3">
                          <span className="flex items-center gap-1.5 font-medium text-[11px]">
                            <span className={`w-2 h-2 rounded-full ${st.status === 'Online' ? 'bg-[#16A34A]' : 'bg-red-500'}`} />
                            <span className={st.status === 'Online' ? 'text-slate-800' : 'text-red-600 font-semibold'}>
                              {st.status}
                            </span>
                          </span>
                        </td>

                        {/* Footfall Today */}
                        <td className="py-3 font-semibold text-slate-900">
                          {st.footfallToday > 0 ? st.footfallToday.toLocaleString() : '0'}
                        </td>

                        {/* Inventory Availability */}
                        <td className="py-3 font-semibold">
                          {st.inventoryAvailability !== null ? (
                            <span className={st.inventoryAvailability < 80 ? 'text-amber-600' : 'text-emerald-700'}>
                              {st.inventoryAvailability}%
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Avg Queue */}
                        <td className="py-3 font-semibold text-slate-900">
                          {st.avgQueue !== null ? (
                            <span className={st.avgQueue > 10 ? 'text-red-600 font-bold' : ''}>
                              {st.avgQueue}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Avg Wait Time */}
                        <td className="py-3 text-slate-700 font-medium">
                          {st.avgWaitTime}
                        </td>

                        {/* Store Health circular badge */}
                        <td className="py-3 text-center">
                          <div className="inline-flex items-center justify-center">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border-2 ${
                              st.storeHealth >= 85
                                ? 'border-[#16A34A] text-[#16A34A] bg-emerald-50/50'
                                : st.storeHealth >= 70
                                ? 'border-amber-500 text-amber-600 bg-amber-50/50'
                                : 'border-slate-300 text-slate-400 bg-slate-50'
                            }`}>
                              {st.storeHealth}
                            </div>
                          </div>
                        </td>

                        {/* Alerts badge */}
                        <td className="py-3 text-center">
                          {st.status === 'Offline' ? (
                            <span className="w-5 h-5 rounded-full bg-red-500 text-white font-bold text-[10px] inline-flex items-center justify-center">
                              !
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              st.alertsCount >= 4
                                ? 'bg-red-50 text-red-600'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {st.alertsCount}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 text-right pr-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/cameras');
                            }}
                            className="text-[#16A34A] hover:bg-emerald-50 border border-emerald-300 hover:border-emerald-400 rounded px-2.5 py-1 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                          >
                            <span>View Store</span>
                            <span>&rarr;</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Store Locations Map Card (~32% width -> col-span-4) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Store Locations</h2>
              <button className="text-xs text-blue-600 hover:underline font-semibold">View Map</button>
            </div>

            {/* Interactive Tamil Nadu SVG Map */}
            <div className="relative mt-3 h-52 bg-[#EBF7F2] rounded-xl border border-emerald-100 overflow-hidden flex items-center justify-center">
              {/* SVG contour representing Tamil Nadu */}
              <svg viewBox="0 0 350 320" className="w-full h-full">
                {/* Simplified geographic shape */}
                <path
                  d="M 120 40 Q 230 20 280 50 Q 310 90 290 150 Q 300 200 250 240 Q 220 290 140 310 Q 110 270 90 210 Q 80 140 120 40 Z"
                  fill="#D7EFE6"
                  stroke="#A8DFC9"
                  strokeWidth="1.5"
                />

                {/* City Markers */}
                {MAP_CITIES.map(city => {
                  const isCitySelected = selectedStore?.city === city.name;
                  return (
                    <g
                      key={city.name}
                      transform={`translate(${city.x}, ${city.y})`}
                      className="cursor-pointer"
                      onClick={() => {
                        const target = stores.find(s => s.city === city.name);
                        if (target) setSelectedStore(target);
                      }}
                    >
                      {/* Pulse circle for active/selected */}
                      {isCitySelected && (
                        <circle r="9" fill="#16A34A" opacity="0.3" className="animate-ping" />
                      )}
                      <circle
                        r={isCitySelected ? "5.5" : "4"}
                        fill={city.name === 'Tirunelveli' ? '#10B981' : '#16A34A'}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                      <text
                        x="7"
                        y="1"
                        fontSize="9"
                        fontWeight={isCitySelected ? "bold" : "600"}
                        fill="#0F172A"
                        className="select-none"
                      >
                        {city.name}
                      </text>
                      <text
                        x="7"
                        y="10"
                        fontSize="7"
                        fill="#64748B"
                        className="select-none"
                      >
                        ({city.count})
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Map Zoom Controls */}
              <div className="absolute right-3 bottom-3 flex flex-col bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
                <button
                  onClick={() => setMapZoom(z => Math.min(z + 0.2, 1.6))}
                  className="p-1 hover:bg-slate-100 text-slate-700 text-xs font-bold border-b border-slate-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setMapZoom(z => Math.max(z - 0.2, 0.8))}
                  className="p-1 hover:bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Status Legend Overlay top right */}
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs border border-slate-200/80 rounded-md p-2 text-[10px] space-y-1 shadow-2xs">
                <div className="font-bold text-slate-800 text-[10px] mb-1">Store Status</div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1 text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" /> Online
                  </span>
                  <span className="font-bold text-slate-800">11</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1 text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Offline
                  </span>
                  <span className="font-bold text-slate-800">1</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1 text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Warning
                  </span>
                  <span className="font-bold text-slate-800">2</span>
                </div>
              </div>
            </div>

            {/* Selected Store Info Box */}
            {selectedStore && (
              <div className="mt-4 p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={selectedStore.imageUrl}
                      alt={selectedStore.name}
                      className="w-7 h-7 rounded object-cover border border-slate-200"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 leading-tight">{selectedStore.name}</div>
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                        <span>{selectedStore.status}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 border-t border-slate-200/60">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Health Score</span>
                    <span className="font-bold text-slate-900">{selectedStore.storeHealth}/100</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Footfall Today</span>
                    <span className="font-bold text-slate-900">{selectedStore.footfallToday.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Active Alerts</span>
                    <span className="font-bold text-slate-900">{selectedStore.alertsCount}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/cameras')}
                  className="w-full mt-1 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1 transition-colors shadow-xs"
                >
                  <span>View Store</span>
                  <span>&rarr;</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Bottom Section: Row 1 (Charts & Attention Panel) ────────────────── */}
      <div className="px-7 py-3 grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Chart 1: Footfall by Store */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-sm font-bold text-slate-900">Footfall by Store</h3>
              {/* Period Tabs */}
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-[11px] font-semibold">
                {['Today', 'Week', 'Month', 'Custom'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => handlePeriodChange(tab)}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      footfallPeriod === tab
                        ? 'bg-[#16A34A] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Vertical Bar Chart */}
            <div className="mt-4 h-40 flex items-end justify-between gap-2.5 pt-6 pb-2 border-b border-slate-200">
              {footfallData.map(item => {
                const max = 3000;
                const heightPct = Math.min(100, Math.round((item.footfall / max) * 100));
                return (
                  <div key={item.short} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <span className="text-[10px] font-bold text-slate-800 mb-1 opacity-90 group-hover:scale-105 transition-transform">
                      {item.footfall > 0 ? item.footfall.toLocaleString() : '0'}
                    </span>
                    <div
                      className="w-full bg-[#4ADE80] hover:bg-[#22C55E] rounded-t transition-all duration-300 shadow-2xs"
                      style={{ height: `${Math.max(4, heightPct)}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Bar labels */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium pt-2">
              {footfallData.map(item => (
                <div key={item.short} className="flex-1 text-center truncate px-0.5">
                  {item.short}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 2: Store Performance Comparison (Horizontal Bars) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-sm font-bold text-slate-900">Store Performance Comparison</h3>
              <div className="flex items-center gap-1 text-[11px] text-slate-600 font-medium bg-slate-50 border border-slate-200 rounded px-2 py-0.5">
                <span>Store Health</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
            </div>

            {/* Horizontal Bar List */}
            <div className="mt-3 space-y-2.5">
              {stores.map(st => {
                const color = st.storeHealth >= 85 ? 'bg-[#22C55E]' : st.storeHealth >= 70 ? 'bg-[#F59E0B]' : 'bg-slate-300';
                return (
                  <div key={st.storeId} className="flex items-center gap-3 text-xs">
                    <span className="w-36 text-slate-700 font-medium truncate shrink-0">{st.name}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${color}`}
                        style={{ width: `${st.storeHealth}%` }}
                      />
                    </div>
                    <span className="w-6 text-right font-bold text-slate-900 shrink-0 text-xs">{st.storeHealth}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Panel 3: Stores Needing Attention */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Stores Needing Attention</h3>
              <button className="text-xs text-blue-600 hover:underline font-semibold">View All</button>
            </div>

            <div className="mt-3 space-y-3">
              {attentionStores.map(item => {
                const isCritical = item.severity === 'Critical';
                return (
                  <div key={item.id} className="flex items-start justify-between gap-3 p-1">
                    <div className="flex items-start gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isCritical ? 'bg-red-500 text-white font-bold text-xs' : 'bg-amber-500 text-white font-bold text-xs'
                      }`}>
                        !
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 leading-tight">{item.storeName}</div>
                        <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">{item.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{item.detail}</div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      isCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.badge}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* ── Bottom Section: Row 2 (Health Gauge, AI Insights, Recent Activity) ── */}
      <div className="px-7 py-3 pb-8 grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Card 1: Overall Store Health Donut Gauge */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Overall Store Health</h3>

            <div className="flex items-center justify-around mt-3">
              {/* Circular Gauge */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#E2E8F0"
                    strokeWidth="10"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#22C55E"
                    strokeWidth="10"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 * (1 - 0.82)}
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-extrabold text-slate-900 leading-none">82<span className="text-xs font-normal text-slate-400">/100</span></span>
                  <span className="text-xs font-bold text-emerald-600 mt-0.5">Good</span>
                </div>
              </div>

              {/* Breakdown Legend */}
              <div className="space-y-1.5 text-xs">
                {(healthData?.categories || [
                  { label: 'Excellent (2)', color: 'bg-[#16A34A]' },
                  { label: 'Good (6)', color: 'bg-[#22C55E]' },
                  { label: 'Needs Attention (3)', color: 'bg-[#F59E0B]' },
                  { label: 'Critical (1)', color: 'bg-[#EF4444]' }
                ]).map((cat: any) => (
                  <div key={cat.label} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${cat.color || 'bg-emerald-500'}`} />
                    <span className="text-slate-700 text-[11px] font-medium">{cat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: AI Insights */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 pb-2.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">AI Insights</h3>
            </div>

            <div className="space-y-2.5 mt-1">
              {aiInsights.map(ins => (
                <div key={ins.id} className="flex items-start gap-2.5">
                  <div className="shrink-0 mt-0.5">
                    {ins.highlightColor === 'emerald' ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-[10px]">
                        ↑
                      </div>
                    ) : ins.highlightColor === 'red' ? (
                      <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-[10px]">
                        ↓
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-[10px]">
                        !
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-tight">{ins.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">{ins.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 3: Recent Activity (Across All Stores) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Recent Activity (Across All Stores)</h3>
              <button className="text-xs text-blue-600 hover:underline font-semibold">View All</button>
            </div>

            <div className="mt-2.5 space-y-2 text-xs">
              {recentActivity.map(act => (
                <div key={act.id} className="flex items-center gap-2.5 py-0.5">
                  <span className="text-[10px] font-mono text-slate-400 shrink-0 w-14">{act.time}</span>
                  <div className="shrink-0">
                    {act.type === 'critical' ? (
                      <span className="w-2 h-2 rounded-full bg-red-500 block" />
                    ) : act.type === 'warning' ? (
                      <span className="w-2 h-2 rounded-full bg-amber-500 block" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-[#16A34A] block" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-700 font-medium truncate">{act.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default MultiStorePage;
