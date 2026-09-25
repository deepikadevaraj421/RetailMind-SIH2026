import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Tooltip,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  Users, TrendingUp, Clock, Zap, Activity, ArrowUp, ArrowDown,
  Minus, AlertTriangle, BarChart2, MapPin, Eye, RefreshCw,
  Calendar, ChevronDown, Check, Radio, Store, Star, Target
} from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import {
  fetchShopperSummary, fetchFootfallTrend, fetchZoneBreakdown, fetchDailyKpis
} from '../services/api';
import { getSocket } from '../services/socket';

// ── Zone colour palette ───────────────────────────────────────────────────────
const ZONE_COLORS: Record<string, string> = {
  'Entrance':           '#10b981',
  'Grocery':            '#6366f1',
  'Fruits & Vegetables':'#f59e0b',
  'Snacks':             '#ec4899',
  'Dairy':              '#3b82f6',
  'Beverages':          '#8b5cf6',
  'Cosmetics':          '#f472b6',
  'Electronics':        '#06b6d4',
  'Checkout':           '#ef4444',
  'Other':              '#94a3b8',
};
const zoneColor = (z: string) => ZONE_COLORS[z] || '#94a3b8';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number | undefined | null, decimals = 0) {
  if (n == null) return '—';
  return n.toLocaleString('en-IN', { maximumFractionDigits: decimals });
}
function shortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`;
}
function pctChange(current: number, prev: number) {
  if (prev === 0) return 0;
  return ((current - prev) / prev) * 100;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
interface KpiCardProps {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  change?: number;
  loading?: boolean;
}
const KpiCard: React.FC<KpiCardProps> = ({ title, value, sub, icon: Icon, iconColor, bgColor, change, loading }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center justify-between">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColor}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
          change > 0 ? 'bg-emerald-50 text-emerald-700' :
          change < 0 ? 'bg-red-50 text-red-700' :
          'bg-slate-50 text-slate-500'
        }`}>
          {change > 0 ? <ArrowUp className="w-3 h-3" /> :
           change < 0 ? <ArrowDown className="w-3 h-3" /> :
           <Minus className="w-3 h-3" />}
          {Math.abs(change).toFixed(1)}%
        </div>
      )}
    </div>
    {loading ? (
      <div className="space-y-2">
        <div className="h-7 bg-slate-100 rounded-lg animate-pulse w-3/4" />
        <div className="h-4 bg-slate-100 rounded animate-pulse w-1/2" />
      </div>
    ) : (
      <>
        <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</div>
        <div className="text-xs font-medium text-slate-400">{sub || title}</div>
      </>
    )}
  </div>
);

// ── Zone Heatmap Bar (custom horizontal bar) ──────────────────────────────────
const ZoneBar: React.FC<{ zone: string; visitors: number; max: number; dwell: number; highPct: number }> = ({
  zone, visitors, max, dwell, highPct
}) => {
  const pct = max > 0 ? (visitors / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-1.5 group">
      <div className="w-32 shrink-0 text-xs font-semibold text-slate-600 truncate">{zone}</div>
      <div className="flex-1 relative h-6 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: zoneColor(zone) }}
        />
        <span className="absolute inset-0 flex items-center pl-3 text-[11px] font-bold text-white mix-blend-difference pointer-events-none">
          {fmt(visitors)} shoppers
        </span>
      </div>
      <div className="w-20 shrink-0 text-right text-xs text-slate-500">
        <span className="font-bold text-slate-700">{dwell.toFixed(1)}m</span> dwell
      </div>
      {highPct > 20 && (
        <div className="w-16 shrink-0">
          <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
            🔥 {highPct}%
          </span>
        </div>
      )}
    </div>
  );
};

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-slate-900 text-white rounded-xl px-3 py-2 text-xs shadow-xl border border-slate-700">
      <p className="font-bold text-slate-300 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{typeof p.value === 'number' ? p.value.toLocaleString('en-IN', { maximumFractionDigits: 1 }) : p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ── Day-of-Week range selector ────────────────────────────────────────────────
const RANGE_OPTIONS = [
  { label: '7D', days: 7 },
  { label: '14D', days: 14 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
];

// ═════════════════════════════════════════════════════════════════════════════
// Main page component
// ═════════════════════════════════════════════════════════════════════════════
export const ShopperAnalyticsPage: React.FC = () => {
  const [rangeDays, setRangeDays] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [unreadCount, setUnreadCount] = useState(3);

  // Data states
  const [summary, setSummary] = useState<any>(null);
  const [footfallTrend, setFootfallTrend] = useState<any[]>([]);
  const [zoneBreakdown, setZoneBreakdown] = useState<any[]>([]);
  const [kpiData, setKpiData] = useState<any[]>([]);
  const [latestKpi, setLatestKpi] = useState<any>(null);

  const loadAll = useCallback(async (days: number) => {
    setIsLoading(true);
    try {
      const [sum, trend, zones, kpis] = await Promise.all([
        fetchShopperSummary(days),
        fetchFootfallTrend(days),
        fetchZoneBreakdown(days),
        fetchDailyKpis(days),
      ]);
      setSummary(sum);
      setFootfallTrend(trend || []);
      setZoneBreakdown(zones || []);
      setKpiData(kpis.data || []);
      setLatestKpi(kpis.latest || null);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(rangeDays); }, [loadAll, rangeDays]);

  // Socket for notification count
  useEffect(() => {
    const socket = getSocket();
    const onStatus = (s: any) => { if (s.unreadNotifications !== undefined) setUnreadCount(s.unreadNotifications); };
    socket.on('system:status', onStatus);
    return () => { socket.off('system:status', onStatus); };
  }, []);

  // ── Derived data ────────────────────────────────────────────────────────────
  const maxZoneVisitors = useMemo(
    () => Math.max(...zoneBreakdown.map(z => z.totalVisitors || 0), 1),
    [zoneBreakdown]
  );

  // Footfall trend with 7-day moving avg
  const enrichedTrend = useMemo(() => {
    return footfallTrend.map((d, i) => {
      const window = footfallTrend.slice(Math.max(0, i - 6), i + 1);
      const avg = window.reduce((s, w) => s + w.visitors, 0) / window.length;
      return { ...d, movingAvg: Math.round(avg), label: shortDate(d.date) };
    });
  }, [footfallTrend]);

  // KPI trend for multi-line chart
  const kpiTrend = useMemo(() =>
    kpiData.map(d => ({
      label: shortDate(d.date instanceof Date ? d.date.toISOString() : String(d.date)),
      footfall: d.footfall,
      dwell: parseFloat(d.avg_dwell_minutes?.toFixed(2) || '0'),
      storeHealth: parseFloat(d.store_health_score?.toFixed(1) || '0'),
      conversion: parseFloat(d.conversion_indicator_pct?.toFixed(1) || '0'),
      staffEff: parseFloat(d.staff_efficiency_pct?.toFixed(1) || '0'),
    })), [kpiData]);

  // Pie data from zone breakdown
  const pieData = useMemo(() =>
    zoneBreakdown.slice(0, 7).map(z => ({
      name: z.zone,
      value: z.totalVisitors,
    })), [zoneBreakdown]);

  // Radar data — zone vs avg dwell
  const radarData = useMemo(() =>
    zoneBreakdown.slice(0, 6).map(z => ({
      zone: z.zone.split(' ')[0], // short name
      dwell: z.avgDwellMinutes,
      visitors: Math.round(z.avgVisitors),
    })), [zoneBreakdown]);

  // Period change (compare first half vs second half of the trend)
  const footfallChange = useMemo(() => {
    if (footfallTrend.length < 4) return 0;
    const half = Math.floor(footfallTrend.length / 2);
    const prev = footfallTrend.slice(0, half).reduce((s, d) => s + d.visitors, 0) / half;
    const curr = footfallTrend.slice(half).reduce((s, d) => s + d.visitors, 0) / (footfallTrend.length - half);
    return pctChange(curr, prev);
  }, [footfallTrend]);

  const refreshedText = lastRefreshed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] min-h-screen overflow-y-auto">

      {/* Top Bar */}
      <TopBar
        unreadCount={unreadCount}
        lastSyncedText={refreshedText}
        searchValue=""
        onSearchChange={() => {}}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3.5 px-6 bg-white border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Shoppers &amp; Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Footfall trends, zone heatmaps, dwell time &amp; store KPIs — powered by real retail data.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date range selector */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {RANGE_OPTIONS.map(opt => (
              <button
                key={opt.days}
                onClick={() => setRangeDays(opt.days)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  rangeDays === opt.days
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={() => loadAll(rangeDays)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-500' : ''}`} />
            Refresh
          </button>

          {/* Live badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </div>
        </div>
      </div>

      {/* ── BODY ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 p-6 space-y-6">

        {/* ── KPI Summary Cards ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            Store Performance — Last {rangeDays} Days
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <KpiCard
              title="Total Footfall"
              value={summary ? fmt(summary.totalFootfall) : '—'}
              sub={`Avg ${summary ? fmt(summary.avgDailyFootfall) : '—'}/day`}
              icon={Users}
              iconColor="text-indigo-600"
              bgColor="bg-indigo-50"
              change={footfallChange}
              loading={isLoading}
            />
            <KpiCard
              title="Avg Dwell Time"
              value={latestKpi ? `${latestKpi.avg_dwell_minutes?.toFixed(1)}m` : '—'}
              sub="Minutes per visit"
              icon={Clock}
              iconColor="text-amber-600"
              bgColor="bg-amber-50"
              loading={isLoading}
            />
            <KpiCard
              title="Store Health"
              value={latestKpi ? `${latestKpi.store_health_score?.toFixed(1)}` : '—'}
              sub="Health score (0–100)"
              icon={Activity}
              iconColor="text-emerald-600"
              bgColor="bg-emerald-50"
              loading={isLoading}
            />
            <KpiCard
              title="Conversion Rate"
              value={latestKpi ? `${latestKpi.conversion_indicator_pct?.toFixed(1)}%` : '—'}
              sub="Shoppers who purchased"
              icon={Target}
              iconColor="text-rose-600"
              bgColor="bg-rose-50"
              loading={isLoading}
            />
            <KpiCard
              title="Staff Efficiency"
              value={latestKpi ? `${latestKpi.staff_efficiency_pct?.toFixed(1)}%` : '—'}
              sub="Operational efficiency"
              icon={Star}
              iconColor="text-violet-600"
              bgColor="bg-violet-50"
              loading={isLoading}
            />
          </div>
        </section>

        {/* ── Row 2: Footfall Trend (wide) + Pie (narrow) ──────────────────── */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Footfall Area Chart */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Daily Footfall Trend</h3>
                <p className="text-xs text-slate-400 mt-0.5">Entrance visitors with 7-day moving average</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-indigo-400 inline-block rounded" />Daily</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-amber-400 inline-block rounded" />7-day avg</span>
              </div>
            </div>
            {isLoading ? (
              <div className="h-52 bg-slate-50 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={enrichedTrend} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="footfallGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(enrichedTrend.length / 8) - 1)} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="visitors" name="Visitors" stroke="#6366f1" strokeWidth={2} fill="url(#footfallGrad)" dot={false} />
                  <Area type="monotone" dataKey="movingAvg" name="7-day Avg" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3" fill="url(#avgGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Zone Pie Chart */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800">Zone Traffic Share</h3>
              <p className="text-xs text-slate-400 mt-0.5">Total visitor distribution</p>
            </div>
            {isLoading ? (
              <div className="h-52 bg-slate-50 rounded-xl animate-pulse" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={zoneColor(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1">
                  {pieData.slice(0, 5).map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: zoneColor(d.name) }} />
                        <span className="text-slate-600 truncate max-w-[90px]">{d.name}</span>
                      </div>
                      <span className="font-bold text-slate-800">{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* ── Row 3: Zone Heatmap + Radar ───────────────────────────────────── */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Zone Heatmap (horizontal bars) */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Zone Visitor Heatmap</h3>
                <p className="text-xs text-slate-400 mt-0.5">Total visitors + avg dwell time per zone · 🔥 = high traffic days &gt;20%</p>
              </div>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => <div key={i} className="h-8 bg-slate-50 rounded-lg animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-1">
                {zoneBreakdown.map(z => (
                  <ZoneBar
                    key={z.zone}
                    zone={z.zone}
                    visitors={z.totalVisitors}
                    max={maxZoneVisitors}
                    dwell={z.avgDwellMinutes}
                    highPct={z.highTrafficPct}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Radar Chart — Dwell by Zone */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800">Avg Dwell by Zone</h3>
              <p className="text-xs text-slate-400 mt-0.5">Minutes per shopper visit</p>
            </div>
            {isLoading ? (
              <div className="h-52 bg-slate-50 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="zone" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <PolarRadiusAxis tick={{ fontSize: 9, fill: '#94a3b8' }} />
                  <Radar name="Dwell (min)" dataKey="dwell" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* ── Row 4: Store KPI Trend ─────────────────────────────────────────── */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Store Health & Conversion over time */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Store Health &amp; Conversion Trend</h3>
                <p className="text-xs text-slate-400 mt-0.5">Daily operational scores</p>
              </div>
            </div>
            {isLoading ? (
              <div className="h-52 bg-slate-50 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={kpiTrend} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(kpiTrend.length / 6) - 1)} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="storeHealth" name="Store Health" stroke="#10b981" strokeWidth={2} fill="url(#healthGrad)" dot={false} />
                  <Area type="monotone" dataKey="conversion" name="Conversion %" stroke="#f59e0b" strokeWidth={1.5} fill="url(#convGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Staff Efficiency Bar Chart */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Staff Efficiency &amp; Queue Trends</h3>
                <p className="text-xs text-slate-400 mt-0.5">Efficiency % vs avg queue length</p>
              </div>
            </div>
            {isLoading ? (
              <div className="h-52 bg-slate-50 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={kpiTrend.slice(-14)} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="staffEff" name="Staff Eff. %" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* ── Row 5: Detailed Zone Table ─────────────────────────────────────── */}
        <section>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Zone Intelligence Table</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Detailed breakdown for the last {rangeDays} days — sorted by total visitors
                </p>
              </div>
              <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg font-mono">
                {zoneBreakdown.length} zones
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-slate-50 rounded-lg animate-pulse" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left">
                      <th className="pb-2 text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Zone</th>
                      <th className="pb-2 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Total Visitors</th>
                      <th className="pb-2 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Daily Avg</th>
                      <th className="pb-2 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Avg Dwell</th>
                      <th className="pb-2 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">High Traffic Days</th>
                      <th className="pb-2 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Traffic %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {zoneBreakdown.map((z, i) => (
                      <tr key={z.zone} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 pl-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: zoneColor(z.zone) }}
                            />
                            <span className="font-semibold text-slate-700">{z.zone}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-right font-bold text-slate-800">{fmt(z.totalVisitors)}</td>
                        <td className="py-2.5 text-right text-slate-600">{fmt(z.avgVisitors)}</td>
                        <td className="py-2.5 text-right">
                          <span className={`font-semibold ${z.avgDwellMinutes > 3 ? 'text-indigo-600' : 'text-slate-600'}`}>
                            {z.avgDwellMinutes?.toFixed(1)}m
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-slate-600">{z.highTrafficDays}</td>
                        <td className="py-2.5 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            z.highTrafficPct > 30 ? 'bg-red-50 text-red-700' :
                            z.highTrafficPct > 15 ? 'bg-amber-50 text-amber-700' :
                            'bg-slate-50 text-slate-500'
                          }`}>
                            {z.highTrafficPct?.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* ── Footer note ──────────────────────────────────────────────────── */}
        <div className="text-center text-xs text-slate-400 pb-4">
          Data sourced from <span className="font-semibold text-slate-500">RetailMind Synthetic Dataset v1</span> ·
          Chennai – Anna Nagar Store · Last refreshed at{' '}
          <span className="font-mono font-semibold text-slate-600">{refreshedText}</span>
        </div>
      </div>
    </div>
  );
};

export default ShopperAnalyticsPage;
