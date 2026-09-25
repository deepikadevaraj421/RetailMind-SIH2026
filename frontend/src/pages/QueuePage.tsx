import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Clock, Timer, Activity, TrendingUp, Lightbulb,
  ChevronDown, ArrowUp, ArrowDown, Check, AlertTriangle,
  Sparkles, RefreshCw, Eye, Maximize2, ShieldAlert, Download
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, ReferenceDot
} from 'recharts';
import { TopBar } from '../components/layout/TopBar';
import {
  fetchQueueLive, fetchQueuePredictions, fetchQueueInsights, toggleQueueCounter
} from '../services/api';
import { getSocket } from '../services/socket';

export const QueuePage: React.FC = () => {
  const [selectedCounterFilter, setSelectedCounterFilter] = useState('All Counters');
  const [predictionMinutes, setPredictionMinutes] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(3);

  // Data states
  const [liveStatus, setLiveStatus] = useState<any>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [live, pred, ins] = await Promise.all([
        fetchQueueLive(),
        fetchQueuePredictions(predictionMinutes),
        fetchQueueInsights(),
      ]);
      setLiveStatus(live);
      setPredictions(pred);
      setInsights(ins);
    } catch (err) {
      console.error('Failed to load queue data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [predictionMinutes]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Real-time socket listeners
  useEffect(() => {
    const socket = getSocket();
    const onQueueUpdate = (status: any) => {
      setLiveStatus(status);
    };
    const onQueuePred = (pred: any) => {
      setPredictions(pred);
    };
    const onStatus = (s: any) => {
      if (s.unreadNotifications !== undefined) setUnreadCount(s.unreadNotifications);
    };
    socket.on('queue:update', onQueueUpdate);
    socket.on('queue:prediction', onQueuePred);
    socket.on('system:status', onStatus);
    return () => {
      socket.off('queue:update', onQueueUpdate);
      socket.off('queue:prediction', onQueuePred);
      socket.off('system:status', onStatus);
    };
  }, []);

  const handleToggleCounter = async (counterId = 4) => {
    try {
      const updated = await toggleQueueCounter(counterId);
      setLiveStatus((prev: any) => {
        if (!prev) return prev;
        const newCounters = prev.counters.map((c: any) => c.id === counterId ? updated : c);
        const active = newCounters.filter((c: any) => c.isLive);
        return {
          ...prev,
          activeCountersRatio: `${active.length} / 4`,
          closedCount: 4 - active.length,
          counters: newCounters
        };
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadReport = () => {
    window.open('/api/reports/queue/export', '_blank');
  };

  const countersToDisplay = React.useMemo(() => {
    if (!liveStatus?.counters) return [];
    if (selectedCounterFilter === 'All Counters') return liveStatus.counters;
    return liveStatus.counters.filter((c: any) => c.name === selectedCounterFilter);
  }, [liveStatus, selectedCounterFilter]);

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
            <Users className="w-5 h-5 text-emerald-600" />
            Queue &amp; Predictions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Live queue monitoring, waiting time analysis and AI-based predictions.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCounterFilter}
            onChange={(e) => setSelectedCounterFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm hover:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="All Counters">All Counters</option>
            <option value="Counter 1">Counter 1</option>
            <option value="Counter 2">Counter 2</option>
            <option value="Counter 3">Counter 3</option>
            <option value="Counter 4">Counter 4</option>
          </select>
          <button
            onClick={loadAll}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 p-6 space-y-5">

        {/* ── ROW 1: 4 Top KPI Cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Queue Length */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Queue Length</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900">
                {liveStatus?.totalQueueLength ?? 13}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-red-600 mt-0.5">
                <ArrowUp className="w-3 h-3" />
                <span>+{liveStatus?.queueChange ?? 4} vs. last hour</span>
              </div>
            </div>
          </div>

          {/* 2. Avg. Waiting Time */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Avg. Wait</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900">
                {liveStatus?.avgWaitingMinutes ?? '4m 20s'}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-red-600 mt-0.5">
                <ArrowUp className="w-3 h-3" />
                <span>{liveStatus?.waitingChange ?? '+1m 10s'}</span>
              </div>
            </div>
          </div>

          {/* 3. Avg. Service Time */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Avg. Service</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <Timer className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900">
                {liveStatus?.avgServiceMinutes ?? '2m 05s'}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-0.5">
                <ArrowDown className="w-3 h-3" />
                <span>{liveStatus?.serviceChange ?? '-20s'}</span>
              </div>
            </div>
          </div>

          {/* 4. Active Counters */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Active Counters</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900">
                {liveStatus?.activeCountersRatio ?? '3 / 4'}
              </div>
              <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                {liveStatus?.closedCount ?? 1} closed
              </div>
            </div>
          </div>
        </div>

        {/* ── ROW 2: Live Queue View (Left) & Queue Prediction (Right) ─────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* 1. Live Queue View — 3 cols */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-extrabold text-slate-900">Live Queue View</h2>
              <span className="text-xs font-medium text-slate-400">{countersToDisplay.length} Counters</span>
            </div>

            {/* 2x2 Grid of Counters — FIXED: constrained height */}
            <div className="grid grid-cols-2 gap-3">
              {countersToDisplay.map((counter: any) => (
                <div
                  key={counter.id}
                  className={`relative rounded-xl overflow-hidden border group transition-all ${
                    counter.isCongested ? 'border-red-400 ring-1 ring-red-200' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top Label */}
                  <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded-md">
                    <span className={`w-2 h-2 rounded-full ${
                      counter.isLive ? (counter.isCongested ? 'bg-red-500 animate-pulse' : 'bg-emerald-500') : 'bg-slate-400'
                    }`} />
                    <span className="text-[10px] font-extrabold text-white">{counter.name}</span>
                    <span className="text-[9px] text-slate-300 font-mono">
                      {counter.isLive ? 'Live' : 'Closed'}
                    </span>
                  </div>

                  {/* Toggle for Counter 4 */}
                  {counter.id === 4 && (
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={() => handleToggleCounter(4)}
                        className={`px-2 py-0.5 rounded text-[9px] font-extrabold text-white shadow-sm transition-colors ${
                          counter.isLive ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        {counter.isLive ? 'Close' : 'Open Counter 4'}
                      </button>
                    </div>
                  )}

                  {/* Image — FIXED: constrained to 140px height */}
                  <div className="relative w-full bg-slate-800" style={{ height: '140px' }}>
                    <img
                      src={counter.imageUrl}
                      alt={counter.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* AI Detection Box */}
                    {counter.isLive && (
                      <div className={`absolute inset-x-4 bottom-3 top-8 border-2 rounded pointer-events-none ${
                        counter.isCongested ? 'border-red-500/60 bg-red-500/5' : 'border-emerald-500/60 bg-emerald-500/5'
                      }`}>
                        <span className={`absolute -top-2 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-black text-white ${
                          counter.isCongested ? 'bg-red-600' : 'bg-emerald-600'
                        }`}>
                          {counter.peopleCount} Detect
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Stats Footer */}
                  <div className="px-3 py-2 bg-white flex items-center justify-between border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-900 text-xs font-bold">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span>{counter.peopleCount} people</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      counter.isLive
                        ? (counter.isCongested ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600')
                        : 'bg-slate-50 text-slate-400'
                    }`}>
                      {counter.isLive ? `Avg ${counter.avgWait}` : 'Closed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Queue Prediction — 2 cols */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col">
            {/* Header with time horizon dropdown */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Queue Prediction
              </h2>
              <select
                value={predictionMinutes}
                onChange={(e) => setPredictionMinutes(parseInt(e.target.value))}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:border-emerald-500 focus:outline-none"
              >
                <option value={10}>Next 10 min</option>
                <option value={20}>Next 20 min</option>
                <option value={30}>Next 30 min</option>
              </select>
            </div>

            {/* Line Chart */}
            <div className="w-full my-2" style={{ height: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={predictions?.dataPoints || []} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 20]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="current"
                    stroke="#16a34a"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#16a34a' }}
                    name="Current Queue"
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#ef4444' }}
                    name="Predicted Queue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Legend Row */}
            <div className="flex items-center justify-center gap-5 text-[10px] font-semibold text-slate-500 mb-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                Current Queue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                Predicted ({predictions?.targetPredicted ?? 15})
              </span>
            </div>

            {/* Alert & Recommendation Cards */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100 flex-1">
              {/* High Congestion Alert */}
              <div className="p-3 bg-red-50/80 border border-red-200/80 rounded-lg flex items-start gap-2.5">
                <TrendingUp className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[11px] font-black text-red-900">{predictions?.alert?.title || 'High congestion likely'}</h4>
                  <p className="text-[10px] text-red-700 mt-0.5 leading-relaxed">{predictions?.alert?.message || 'Queue at Counter 2 expected to reach 15 people in 10 min.'}</p>
                </div>
              </div>

              {/* Recommendation */}
              <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-lg flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-[11px] font-black text-emerald-900">{predictions?.recommendation?.title || 'Recommendation'}</h4>
                  <p className="text-[10px] text-emerald-700 mt-0.5 leading-relaxed">{predictions?.recommendation?.message || 'Open Counter 4 to reduce congestion.'}</p>
                </div>
                <button
                  onClick={() => handleToggleCounter(4)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-colors shrink-0"
                >
                  Action
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── ROW 3: Queue Insights & AI Predictions ───────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* 1. Queue Insights */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
            <h2 className="text-sm font-extrabold text-slate-900 mb-4">Queue Insights</h2>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Peak Queue */}
              <div className="p-3 rounded-lg bg-red-50/60 border border-red-100 flex flex-col">
                <span className="text-[10px] font-semibold text-slate-500 leading-tight">Peak Queue Today</span>
                <div className="mt-2">
                  <div className="text-xl font-black text-slate-900">{insights?.peakQueueToday?.count ?? 14}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{insights?.peakQueueToday?.time ?? 'at 6:30 PM'}</div>
                </div>
              </div>

              {/* Total Served */}
              <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100 flex flex-col">
                <span className="text-[10px] font-semibold text-slate-500 leading-tight">Served Today</span>
                <div className="mt-2">
                  <div className="text-xl font-black text-slate-900">{insights?.totalServedToday?.count?.toLocaleString() ?? '1,248'}</div>
                  <div className="text-[10px] font-bold text-emerald-600">+{insights?.totalServedToday?.changePct ?? 8}%</div>
                </div>
              </div>

              {/* Longest Wait Time */}
              <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-100 flex flex-col">
                <span className="text-[10px] font-semibold text-slate-500 leading-tight">Longest Wait</span>
                <div className="mt-2">
                  <div className="text-xl font-black text-slate-900">{insights?.longestWaitTime?.duration ?? '8m 20s'}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{insights?.longestWaitTime?.time ?? 'at 6:15 PM'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. AI Predictions & Insights — spans 2 cols */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                AI Predictions &amp; Insights
              </h2>
              <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700">View All</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
              {insights?.predictions?.map((item: any, i: number) => (
                <div key={i} className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 flex flex-col hover:bg-white hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[11px] font-extrabold text-slate-800">{item.title}</h4>
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
