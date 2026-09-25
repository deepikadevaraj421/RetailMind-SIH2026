import React, { useState, useEffect } from 'react';
import {
  FileText, Clock, Edit3, BarChart2, Calendar, ChevronDown,
  ArrowUp, LogIn, LogOut, CheckCircle2, Download, FileSpreadsheet,
  Mail, Lightbulb, Check, Search, Store, X, Plus, Filter
} from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { fetchReportData } from '../services/api';

export const ReportsPage: React.FC = () => {
  // Config state
  const [reportType, setReportType] = useState('Shopper Analytics');
  const [selectedStore, setSelectedStore] = useState('Chennai – Anna Nagar');
  const [period, setPeriod] = useState('Daily');
  const [dateRange, setDateRange] = useState('01 Sep 2026 – 14 Sep 2026');

  // Active sub-tabs
  const [reportCategory, setReportCategory] = useState<'standard' | 'scheduled' | 'custom'>('standard');
  const [tableTab, setTableTab] = useState<'detailed' | 'insights' | 'visualizations' | 'history'>('detailed');

  // Data & loading
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleEmail, setScheduleEmail] = useState('admin@retailmind.ai');
  const [scheduleFreq, setScheduleFreq] = useState('Weekly on Monday');
  const [customModalOpen, setCustomModalOpen] = useState(false);

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await fetchReportData({ reportType, store: selectedStore, period });
      if (res) setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const res = await fetchReportData({ reportType, store: selectedStore, period });
      if (res) {
        setData(res);
        showToast('Report generated successfully!');
      }
    } catch (e) {
      showToast('Error generating report');
    } finally {
      setGenerating(false);
    }
  };

  // Download handlers
  const handleDownloadCsv = () => {
    if (!data) return;
    let csv = `RetailMind - ${data.reportSummary.reportType} Report\n`;
    csv += `Store: ${data.reportSummary.store}, Date Range: ${data.reportSummary.dateRange}, Period: ${data.reportSummary.period}\n`;
    csv += `Generated On: ${data.reportSummary.generatedOn} by ${data.reportSummary.generatedBy}\n\n`;
    csv += `Date,Footfall,Entries,Exits,Avg Dwell Time,Peak Hour,Busiest Zone\n`;
    for (const r of data.detailedRows) {
      csv += `"${r.date}",${r.footfall},${r.entries},${r.exits},"${r.avgDwellTime}","${r.peakHour}","${r.busiestZone}"\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `RetailMind_${reportType.replace(/\s+/g, '_')}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV report downloaded!');
  };

  const handleDownloadExcel = () => {
    // In browser, trigger CSV with .xls extension or CSV download for spreadsheet compatibility
    handleDownloadCsv();
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  if (loading && !data) {
    return (
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAF9] min-h-screen p-8 space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-lg w-72"></div>
        <div className="h-16 bg-white rounded-xl"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const footfallTrend = data?.footfallTrend || [];
  const topZones = data?.topZones || [];
  const detailedRows = data?.detailedRows || [];
  const reportSummary = data?.reportSummary || {};

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAF9] min-h-screen overflow-y-auto font-sans text-[#0F172A]">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg border bg-emerald-50 text-emerald-800 border-emerald-200 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar */}
      <TopBar
        storeName={selectedStore}
        isOnline={true}
        lastSyncedText="just now"
        unreadCount={5}
      />

      {/* Page Header Area with Supermarket Banner */}
      <div className="px-7 pt-6 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Reports</h1>
            <p className="text-xs text-slate-500 mt-1">Generate insights. Track performance. Make better decisions.</p>
          </div>

          {/* Banner Graphic on Right */}
          <div className="relative overflow-hidden rounded-xl h-20 w-full lg:w-[480px] shadow-xs border border-slate-200 bg-slate-900 shrink-0">
            <img
              src="https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80"
              alt="Reports Banner"
              className="w-full h-full object-cover opacity-60 filter brightness-95"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/60 flex items-center justify-end px-6">
              <div className="text-right">
                <div className="text-white/95 font-serif italic text-base leading-tight drop-shadow tracking-wide">
                  Data Today
                </div>
                <div className="text-white/95 font-serif italic text-base leading-tight drop-shadow tracking-wide flex items-center justify-end gap-1">
                  <span>A Better Tomorrow</span>
                  <span className="text-emerald-400 not-italic text-sm">🍃</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Report Configuration Bar ────────────────────────────────────────── */}
        <div className="mt-5 space-y-3">
          {/* Tabs: Standard Reports | Scheduled Reports | Custom Reports */}
          <div className="flex items-center gap-2">
            {[
              { id: 'standard', label: 'Standard Reports', icon: FileText },
              { id: 'scheduled', label: 'Scheduled Reports', icon: Clock },
              { id: 'custom', label: 'Custom Reports', icon: Edit3 },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = reportCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setReportCategory(tab.id as any);
                    if (tab.id === 'scheduled') setScheduleModalOpen(true);
                    if (tab.id === 'custom') setCustomModalOpen(true);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#16A34A] text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Filter Controls Row */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Report Type */}
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Report Type</span>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#16A34A]"
                >
                  <option value="Shopper Analytics">Shopper Analytics</option>
                  <option value="Inventory Health">Inventory Health</option>
                  <option value="Queue Efficiency">Queue Efficiency</option>
                  <option value="Store Health">Store Health</option>
                </select>
              </div>

              {/* Store */}
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Store</span>
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#16A34A]"
                >
                  <option value="Chennai – Anna Nagar">Chennai – Anna Nagar</option>
                  <option value="Coimbatore – RS Puram">Coimbatore – RS Puram</option>
                  <option value="Madurai – KK Nagar">Madurai – KK Nagar</option>
                  <option value="Salem – Hasthampatti">Salem – Hasthampatti</option>
                  <option value="Trichy – Thillai Nagar">Trichy – Thillai Nagar</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Date Range</span>
                <button
                  onClick={() => showToast('Date range: 01 Sep 2026 – 14 Sep 2026')}
                  className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 font-semibold flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{dateRange}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
              </div>

              {/* Period */}
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Period</span>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#16A34A]"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
            </div>

            {/* Generate Report Button */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
            >
              <BarChart2 className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'Generating...' : 'Generate Report'}</span>
            </button>
          </div>
        </div>

        {/* ── 4 KPI Summary Cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">

          {/* KPI 1: Total Footfall */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex items-center gap-3.5 hover:border-slate-300 transition-colors">
            <div className="w-11 h-11 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center shrink-0">
              <span className="text-xl">👥</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Total Footfall</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-2xl font-extrabold text-slate-900">
                  {summary.totalFootfall ? summary.totalFootfall.toLocaleString() : '18,452'}
                </span>
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  <ArrowUp className="w-3 h-3" /> {summary.footfallChangePct || 12}%
                </span>
              </div>
              <span className="text-[11px] text-slate-400">vs. previous period</span>
            </div>
          </div>

          {/* KPI 2: Avg. Dwell Time */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex items-center gap-3.5 hover:border-slate-300 transition-colors">
            <div className="w-11 h-11 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Avg. Dwell Time</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-2xl font-extrabold text-slate-900">{summary.avgDwellTime || '4m 32s'}</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  <ArrowUp className="w-3 h-3" /> {summary.dwellChangePct || 8}%
                </span>
              </div>
              <span className="text-[11px] text-slate-400">vs. previous period</span>
            </div>
          </div>

          {/* KPI 3: Total Entries */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex items-center gap-3.5 hover:border-slate-300 transition-colors">
            <div className="w-11 h-11 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center shrink-0">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Total Entries</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-2xl font-extrabold text-slate-900">
                  {summary.totalEntries ? summary.totalEntries.toLocaleString() : '9,312'}
                </span>
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  <ArrowUp className="w-3 h-3" /> {summary.entriesChangePct || 11}%
                </span>
              </div>
              <span className="text-[11px] text-slate-400">vs. previous period</span>
            </div>
          </div>

          {/* KPI 4: Total Exits */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex items-center gap-3.5 hover:border-slate-300 transition-colors">
            <div className="w-11 h-11 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Total Exits</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-2xl font-extrabold text-slate-900">
                  {summary.totalExits ? summary.totalExits.toLocaleString() : '9,140'}
                </span>
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  <ArrowUp className="w-3 h-3" /> {summary.exitsChangePct || 10}%
                </span>
              </div>
              <span className="text-[11px] text-slate-400">vs. previous period</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── Main Section: Charts + Detailed Table + Right Sidebar ─────────────── */}
      <div className="px-7 py-2 grid grid-cols-1 lg:grid-cols-12 gap-5 pb-10">

        {/* Left Column (~70% width -> col-span-8) */}
        <div className="lg:col-span-8 space-y-5">

          {/* Charts Row: Footfall Trend & Top Performing Zones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Chart 1: Footfall Trend */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2">
                  <h3 className="text-sm font-bold text-slate-900">Footfall Trend</h3>
                  <div className="flex items-center gap-1 text-[11px] text-slate-600 font-medium bg-slate-50 border border-slate-200 rounded px-2 py-0.5">
                    <span>Daily</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                </div>

                {/* Vertical Bar Chart with Y-axis */}
                <div className="mt-3 flex gap-2">
                  {/* Y-axis labels */}
                  <div className="flex flex-col justify-between text-[10px] text-slate-400 font-mono py-1 pr-1 text-right h-36 select-none">
                    <span>2K</span>
                    <span>1.5K</span>
                    <span>1K</span>
                    <span>500</span>
                    <span>0</span>
                  </div>

                  {/* Bars container */}
                  <div className="flex-1 h-36 flex items-end justify-between gap-1 border-b border-l border-slate-200 px-1 pb-0.5">
                    {footfallTrend.map((item: any) => {
                      const max = 2000;
                      const heightPct = Math.min(100, Math.round((item.footfall / max) * 100));
                      return (
                        <div key={item.date} className="flex-1 flex flex-col items-center justify-end h-full group">
                          <div
                            className="w-full bg-[#4ADE80] hover:bg-[#22C55E] rounded-t transition-all duration-300"
                            style={{ height: `${heightPct}%` }}
                            title={`${item.shortDate}: ${item.footfall.toLocaleString()} visitors`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* X-axis labels */}
                <div className="flex justify-between text-[9px] text-slate-400 font-mono pt-1.5 pl-7 pr-1">
                  <span>Sep 01</span>
                  <span>Sep 03</span>
                  <span>Sep 05</span>
                  <span>Sep 07</span>
                  <span>Sep 09</span>
                  <span>Sep 11</span>
                  <span>Sep 13</span>
                </div>
              </div>
            </div>

            {/* Chart 2: Top Performing Zones */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 pb-3">Top Performing Zones</h3>

                <div className="space-y-3 mt-1">
                  {topZones.map((z: any, idx: number) => {
                    const colors = ['bg-[#16A34A]', 'bg-[#22C55E]', 'bg-[#4ADE80]', 'bg-[#86EFAC]', 'bg-[#BBF7D0]'];
                    const max = 4000;
                    const widthPct = Math.min(100, Math.round((z.count / max) * 100));
                    return (
                      <div key={z.zone} className="flex items-center gap-3 text-xs">
                        <span className="w-20 text-slate-600 font-medium truncate shrink-0">{z.zone}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-3.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${colors[idx] || 'bg-[#16A34A]'}`}
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                        <span className="w-10 text-right font-bold text-slate-900 shrink-0">{z.count.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* Detailed Data Section with Tabs & Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            {/* Table sub-tabs */}
            <div className="flex items-center gap-1 pb-3 border-b border-slate-100">
              {[
                { id: 'detailed', label: 'Detailed Data' },
                { id: 'insights', label: 'Insights' },
                { id: 'visualizations', label: 'Visualizations' },
                { id: 'history', label: 'Export History' }
              ].map(t => {
                const isActive = tableTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTableTab(t.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#16A34A] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Table View */}
            {tableTab === 'detailed' && (
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 text-slate-400 font-medium">
                    <tr>
                      <th className="pb-2.5 pl-1 font-medium">Date</th>
                      <th className="pb-2.5 font-medium">Footfall</th>
                      <th className="pb-2.5 font-medium">Entries</th>
                      <th className="pb-2.5 font-medium">Exits</th>
                      <th className="pb-2.5 font-medium">Avg. Dwell Time</th>
                      <th className="pb-2.5 font-medium">Peak Hour</th>
                      <th className="pb-2.5 font-medium">Busiest Zone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detailedRows.map((r: any) => (
                      <tr key={r.date} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 pl-1 font-semibold text-slate-900">{r.date}</td>
                        <td className="py-2.5 text-slate-800">{r.footfall.toLocaleString()}</td>
                        <td className="py-2.5 text-slate-600">{r.entries.toLocaleString()}</td>
                        <td className="py-2.5 text-slate-600">{r.exits.toLocaleString()}</td>
                        <td className="py-2.5 text-slate-700 font-medium">{r.avgDwellTime}</td>
                        <td className="py-2.5 text-slate-600 font-mono text-[11px]">{r.peakHour}</td>
                        <td className="py-2.5 font-medium text-slate-800">{r.busiestZone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tableTab === 'insights' && (
              <div className="py-4 space-y-2.5 text-xs">
                <div className="p-3 bg-emerald-50 rounded-lg text-emerald-900 font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Footfall showed strong +12% growth over previous cycle with peak hours consistently at 6:00 PM.</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg text-slate-700 font-medium flex items-center gap-2">
                  <Store className="w-4 h-4 text-slate-500" />
                  <span>Grocery zone captures 38.4% of total visitors, followed by Fruits &amp; Veg with 29.4%.</span>
                </div>
              </div>
            )}

            {tableTab === 'visualizations' && (
              <div className="py-6 text-center text-xs text-slate-500">
                <span>Detailed spatial heatmaps and shopper trajectory plots are active in Shoppers &amp; Analytics tab.</span>
              </div>
            )}

            {tableTab === 'history' && (
              <div className="py-3 space-y-2 text-xs">
                <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded">
                  <span className="font-semibold text-slate-800">Shopper_Analytics_Daily.pdf</span>
                  <span className="text-slate-400">14 Sep 2026, 11:16 PM</span>
                  <button onClick={handleDownloadPdf} className="text-[#16A34A] font-semibold hover:underline">Re-download</button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column (~30% width -> col-span-4) */}
        <div className="lg:col-span-4 space-y-5">

          {/* Report Summary Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Report Summary</h2>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-400 font-medium">Report Type</span>
                <span className="text-slate-800 font-semibold">{reportSummary.reportType}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-400 font-medium">Store</span>
                <span className="text-slate-800 font-semibold">{reportSummary.store}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-400 font-medium">Date Range</span>
                <span className="text-slate-800 font-semibold">{reportSummary.dateRange}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-400 font-medium">Period</span>
                <span className="text-slate-800 font-semibold">{reportSummary.period}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-400 font-medium">Generated On</span>
                <span className="text-slate-800 font-semibold">{reportSummary.generatedOn}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-400 font-medium">Generated By</span>
                <span className="text-slate-800 font-semibold">{reportSummary.generatedBy}</span>
              </div>
            </div>

            {/* Green confirmation message */}
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-lg p-3 flex items-start gap-2.5 text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold leading-tight">Report generated successfully!</div>
                <div className="text-[11px] text-emerald-700 mt-0.5">Your report is ready to download.</div>
              </div>
            </div>
          </div>

          {/* Download Report Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Download Report</h3>

            <div className="space-y-2">
              <button
                onClick={handleDownloadPdf}
                className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>

              <button
                onClick={handleDownloadCsv}
                className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                <span>Download CSV</span>
              </button>

              <button
                onClick={handleDownloadExcel}
                className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Download Excel</span>
              </button>
            </div>
          </div>

          {/* Schedule This Report Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Schedule This Report</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Set up automatic report generation and receive reports via email.
            </p>
            <button
              onClick={() => setScheduleModalOpen(true)}
              className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 py-1.5 px-3 rounded text-xs font-semibold transition-colors mt-1"
            >
              Schedule Report
            </button>
          </div>

          {/* Need Custom Insights? Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Need Custom Insights?</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Create a custom report with specific metrics, filters and visualizations.
            </p>
            <button
              onClick={() => setCustomModalOpen(true)}
              className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 py-1.5 px-3 rounded text-xs font-semibold transition-colors mt-1"
            >
              Create Custom Report
            </button>
          </div>

        </div>

      </div>

      {/* ── Schedule Report Modal ────────────────────────────────────────────── */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#16A34A]" />
                <span>Schedule Report</span>
              </h3>
              <button onClick={() => setScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Recipient Email</label>
                <input
                  type="email"
                  value={scheduleEmail}
                  onChange={(e) => setScheduleEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-1.5"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Frequency</label>
                <select
                  value={scheduleFreq}
                  onChange={(e) => setScheduleFreq(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 font-medium"
                >
                  <option value="Daily at 8:00 AM">Daily at 8:00 AM</option>
                  <option value="Weekly on Monday">Weekly on Monday</option>
                  <option value="Monthly on 1st">Monthly on 1st</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setScheduleModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setScheduleModalOpen(false);
                    showToast(`Report scheduled: ${scheduleFreq} to ${scheduleEmail}`);
                  }}
                  className="px-4 py-1.5 bg-[#16A34A] text-white font-semibold rounded"
                >
                  Confirm Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Report Modal ──────────────────────────────────────────────── */}
      {customModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Create Custom Report</span>
              </h3>
              <button onClick={() => setCustomModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <p className="text-slate-500 leading-snug">
                Select metrics and dimensions to build a bespoke reporting view.
              </p>
              <div className="space-y-1.5">
                {['Footfall & Entrances', 'Zone Dwell Times', 'Inventory Availability', 'Queue Congestion'].map(m => (
                  <label key={m} className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="accent-[#16A34A]" />
                    <span className="text-slate-800">{m}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setCustomModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setCustomModalOpen(false);
                    showToast('Custom report configuration saved!');
                  }}
                  className="px-4 py-1.5 bg-[#16A34A] text-white font-semibold rounded"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReportsPage;
