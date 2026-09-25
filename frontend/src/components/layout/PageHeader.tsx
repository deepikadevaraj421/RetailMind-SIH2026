import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown, Clock, Radio, Check, CalendarDays } from 'lucide-react';

interface PageHeaderProps {
  mode: 'live' | 'playback';
  onModeChange: (mode: 'live' | 'playback') => void;
  selectedDateText?: string;
  onDateChange?: (dateStr: string) => void;
  selectedTimeRange?: string;
  onTimeRangeChange?: (val: string) => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  mode,
  onModeChange,
  selectedDateText,
  onDateChange,
  selectedTimeRange = '06:00 AM – 11:59 PM',
  onTimeRangeChange,
}) => {
  // Live ticking clock (Section 42: updates every second)
  const [liveTime, setLiveTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(
        now.toLocaleTimeString('en-US', {
          hour12: true,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format today's date dynamically (e.g. "Today, 14 Sep 2026")
  const defaultTodayStr = React.useMemo(() => {
    const d = new Date();
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `Today, ${day} ${month} ${year}`;
  }, []);

  const currentDateLabel = selectedDateText || defaultTodayStr;

  // Dropdown visibility states
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [customDateInput, setCustomDateInput] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const timeDropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setIsDateOpen(false);
      }
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(event.target as Node)) {
        setIsTimeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Date Presets (including today and dataset reference dates)
  const datePresets = [
    { label: defaultTodayStr, isToday: true, desc: 'Current Live Day' },
    {
      label: (() => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return `Yesterday, ${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })} ${d.getFullYear()}`;
      })(),
      isToday: false,
      desc: 'Previous Day',
    },
    { label: '30 Aug 2026', isToday: false, desc: 'Dataset Latest Snapshot' },
    { label: '15 Aug 2026', isToday: false, desc: 'Peak Promo Campaign' },
    { label: '14 Aug 2026', isToday: false, desc: 'High Footfall Surge' },
  ];

  // Time Range Options
  const timeRanges = [
    { label: '06:00 AM – 11:59 PM', desc: 'Full Store Hours' },
    { label: '06:00 AM – 12:00 PM', desc: 'Morning Shift' },
    { label: '12:00 PM – 04:00 PM', desc: 'Afternoon Rush' },
    { label: '04:00 PM – 09:00 PM', desc: 'Evening Rush' },
    { label: '09:00 PM – 11:59 PM', desc: 'Closing Hours' },
  ];

  const handleSelectDate = (dateLabel: string, isToday: boolean) => {
    if (onDateChange) onDateChange(dateLabel);
    if (!isToday && mode === 'live') {
      onModeChange('playback');
    } else if (isToday) {
      onModeChange('live');
    }
    setIsDateOpen(false);
  };

  const handleCustomDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDateInput) return;
    const parts = customDateInput.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const formatted = `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })} ${d.getFullYear()}`;
      if (onDateChange) onDateChange(formatted);
      onModeChange('playback');
    }
    setIsDateOpen(false);
  };

  const handleSelectTimeRange = (range: string) => {
    if (onTimeRangeChange) onTimeRangeChange(range);
    setIsTimeOpen(false);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3.5 px-6 bg-white border-b border-slate-200 select-none">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          Cameras & Timeline
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Live view, playback and events — all in one place.
        </p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* Live Clock Ticker Badge (Section 42) */}
        {mode === 'live' ? (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50/80 border border-emerald-200/80 rounded-lg text-xs font-mono font-bold text-emerald-800 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{liveTime || '00:00:00'}</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-amber-50/80 border border-amber-200/80 rounded-lg text-xs font-semibold text-amber-800 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Playback Mode</span>
          </div>
        )}

        {/* 1. Interactive Date Selector Dropdown */}
        <div className="relative" ref={dateDropdownRef}>
          <button
            type="button"
            onClick={() => {
              setIsDateOpen(!isDateOpen);
              setIsTimeOpen(false);
            }}
            className={`flex items-center space-x-2 px-3 py-1.5 border rounded-lg text-xs font-semibold shadow-2xs transition-all ${
              isDateOpen
                ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>{currentDateLabel}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDateOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Date Dropdown Popover */}
          {isDateOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3 animate-in fade-in zoom-in-95 duration-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Select Store Date</span>
                <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
              </div>

              {/* Presets List */}
              <div className="space-y-1 mb-3">
                {datePresets.map((preset, i) => {
                  const isSelected = currentDateLabel === preset.label;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectDate(preset.label, preset.isToday)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div>
                        <div>{preset.label}</div>
                        {preset.desc && (
                          <div className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                            {preset.desc}
                          </div>
                        )}
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>

              {/* Custom Date Input */}
              <div className="pt-2 border-t border-slate-100">
                <form onSubmit={handleCustomDateSubmit} className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">
                    Pick Specific Date
                  </label>
                  <input
                    type="date"
                    value={customDateInput}
                    onChange={(e) => setCustomDateInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                  >
                    Apply Date
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* 2. Live / Playback Toggle */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => onModeChange('live')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              mode === 'live'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Live</span>
          </button>
          <button
            type="button"
            onClick={() => onModeChange('playback')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              mode === 'playback'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Playback</span>
          </button>
        </div>

        {/* 3. Interactive Time Window Dropdown */}
        <div className="relative" ref={timeDropdownRef}>
          <button
            type="button"
            onClick={() => {
              setIsTimeOpen(!isTimeOpen);
              setIsDateOpen(false);
            }}
            className={`flex items-center space-x-2 px-3 py-1.5 border rounded-lg text-xs font-semibold shadow-2xs transition-all ${
              isTimeOpen
                ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>{selectedTimeRange}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isTimeOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Time Range Dropdown Popover */}
          {isTimeOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1.5">
                Timeline Time Window
              </div>
              <div className="space-y-1">
                {timeRanges.map((item, i) => {
                  const isSelected = selectedTimeRange === item.label;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectTimeRange(item.label)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                          : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{item.label}</div>
                        <div className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {item.desc}
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
