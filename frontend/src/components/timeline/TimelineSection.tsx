import React, { useState, useEffect } from 'react';
import { Camera, TimelineEventItem } from '../../types';
import { Play, Pause, Maximize2, Filter, AlertCircle, AlertTriangle, CheckCircle2, Clock, Calendar } from 'lucide-react';

interface TimelineSectionProps {
  cameras: Camera[];
  events: TimelineEventItem[];
  selectedCamera: Camera | null;
  onSelectCamera: (cam: Camera) => void;
  isPlaybackMode: boolean;
  onTogglePlaybackMode: (mode: 'live' | 'playback') => void;
  onScrubTimeChange?: (timeStr: string) => void;
  selectedTimeRange?: string;
  selectedDate?: string;
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({
  cameras,
  events,
  selectedCamera,
  onSelectCamera,
  isPlaybackMode,
  onTogglePlaybackMode,
  onScrubTimeChange,
  selectedTimeRange = '06:00 AM – 11:59 PM',
  selectedDate,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'events'>('timeline');
  const [playbackSpeed, setPlaybackSpeed] = useState('1x');
  const [scrubberPosition, setScrubberPosition] = useState(68); // ~06:14 PM position (percentage 0 to 100)
  const [isPlaying, setIsPlaying] = useState(false);
  const [eventFilter, setEventFilter] = useState<'ALL' | 'Critical' | 'Warning' | 'Info' | 'Success'>('ALL');

  // Dynamic time markers and minute bounds derived from selectedTimeRange
  const { timeTicks, startMinutes, totalMinutes } = React.useMemo(() => {
    if (selectedTimeRange.includes('12:00 PM') && selectedTimeRange.includes('06:00 AM')) {
      // Morning Shift: 06:00 AM - 12:00 PM (6 hours = 360 mins)
      return {
        timeTicks: ['6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM'],
        startMinutes: 6 * 60,
        totalMinutes: 6 * 60,
      };
    } else if (selectedTimeRange.includes('04:00 PM') && selectedTimeRange.includes('12:00 PM')) {
      // Afternoon Rush: 12:00 PM - 04:00 PM (4 hours = 240 mins)
      return {
        timeTicks: ['12 PM', '1 PM', '2 PM', '3 PM', '4 PM'],
        startMinutes: 12 * 60,
        totalMinutes: 4 * 60,
      };
    } else if (selectedTimeRange.includes('09:00 PM') && selectedTimeRange.includes('04:00 PM')) {
      // Evening Rush: 04:00 PM - 09:00 PM (5 hours = 300 mins)
      return {
        timeTicks: ['4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM'],
        startMinutes: 16 * 60,
        totalMinutes: 5 * 60,
      };
    } else if (selectedTimeRange.includes('09:00 PM') && selectedTimeRange.includes('11:59 PM')) {
      // Closing Hours: 09:00 PM - 11:59 PM (3 hours = 180 mins)
      return {
        timeTicks: ['9 PM', '10 PM', '11 PM', '11:59 PM'],
        startMinutes: 21 * 60,
        totalMinutes: 3 * 60,
      };
    }
    // Default Full Day: 06:00 AM - 11:59 PM (18 hours = 1080 mins)
    return {
      timeTicks: ['10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'],
      startMinutes: 6 * 60,
      totalMinutes: 18 * 60,
    };
  }, [selectedTimeRange]);

  // Current scrubber time string derived from position
  const currentTimeDisplay = React.useMemo(() => {
    const currentMins = Math.round((scrubberPosition / 100) * totalMinutes);
    const finalMins = startMinutes + currentMins;
    const hours = Math.floor(finalMins / 60) % 24;
    const mins = finalMins % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const formatted = `${String(displayHours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:20 ${ampm}`;
    return formatted;
  }, [scrubberPosition, startMinutes, totalMinutes]);  // Playback timer loop when playing
  useEffect(() => {
    if (!isPlaying) return;
    const speedMultiplier = playbackSpeed === '2x' ? 2 : playbackSpeed === '0.5x' ? 0.5 : 1;
    const interval = setInterval(() => {
      setScrubberPosition((prev) => {
        if (prev >= 100) {
          setIsPlaying(false);
          return 0;
        }
        return Math.min(100, prev + 0.5 * speedMultiplier);
      });
    }, 200);
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  useEffect(() => {
    if (isPlaying && onScrubTimeChange) {
      onScrubTimeChange(currentTimeDisplay);
    }
  }, [scrubberPosition, isPlaying, onScrubTimeChange, currentTimeDisplay]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setScrubberPosition(val);
    if (!isPlaybackMode) {
      onTogglePlaybackMode('playback');
    }
    if (onScrubTimeChange) {
      onScrubTimeChange(currentTimeDisplay);
    }
  };

  const filteredEvents = React.useMemo(() => {
    if (eventFilter === 'ALL') return events;
    return events.filter((e) => e.severity === eventFilter);
  }, [events, eventFilter]);

  // Subset of 4 cameras to display in multi-track timeline matching reference design
  const timelineCameras = cameras.slice(0, 4);

  return (
    <div className="bg-white border-t border-slate-200 p-4 select-none">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Timeline Multi-track & Scrubber */}
        <div className="lg:col-span-8 flex flex-col justify-between">
          {/* Top Bar: Tabs & Playback Controls */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setActiveTab('timeline')}
                className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'timeline'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Timeline
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('events')}
                className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'events'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Events ({events.length})
              </button>

              {/* Selected date badge */}
              {selectedDate && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200/80 rounded-lg text-xs font-semibold text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{selectedDate}</span>
                </div>
              )}
            </div>

            {/* Playback Controls */}
            <div className="flex items-center space-x-3 text-xs">
              <button
                type="button"
                onClick={() => onTogglePlaybackMode(isPlaybackMode ? 'live' : 'playback')}
                className="flex items-center space-x-1.5 font-bold"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    !isPlaybackMode ? 'bg-red-500 animate-pulse' : 'bg-slate-400'
                  }`}
                ></span>
                <span className={!isPlaybackMode ? 'text-red-600' : 'text-slate-600'}>
                  {!isPlaybackMode ? 'Live' : 'Playback Mode'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isPlaybackMode) onTogglePlaybackMode('playback');
                  setIsPlaying(!isPlaying);
                }}
                className="p-1 text-slate-600 hover:text-slate-900 rounded"
                title={isPlaying ? 'Pause timeline' : 'Play timeline'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 text-emerald-600" /> : <Play className="w-3.5 h-3.5" />}
              </button>

              {/* Speed Selector */}
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(e.target.value)}
                className="text-xs bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 font-semibold text-slate-700"
              >
                <option value="0.5x">0.5x</option>
                <option value="1x">1x</option>
                <option value="2x">2x</option>
              </select>

              <button title="Timeline Fullscreen" className="text-slate-500 hover:text-slate-800">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Time Marker Header with Scrubber Bubble (aligned with thumbnail tracks) */}
          <div className="relative pt-4 pb-2 ml-[108px] mr-1">
            {/* Scrubber floating bubble */}
            <div
              className="absolute -top-1 -translate-x-1/2 z-20 pointer-events-none transition-all duration-75"
              style={{ left: `${scrubberPosition}%` }}
            >
              <span className="bg-emerald-600 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                {currentTimeDisplay}
              </span>
            </div>

            {/* Time Ticks */}
            <div className="flex justify-between text-[10px] font-semibold text-slate-400 select-none">
              {timeTicks.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>

            {/* Scrubber Slider Line */}
            <div className="relative w-full mt-1.5">
              <input
                type="range"
                min="0"
                max="100"
                value={scrubberPosition}
                onChange={handleSliderChange}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
              />
            </div>
          </div>

          {/* Camera Timeline Rows with Thumbnail Strips */}
          <div className="space-y-2 mt-2">
            {timelineCameras.map((cam) => (
              <div
                key={cam.cameraId}
                onClick={() => onSelectCamera(cam)}
                className={`flex items-center space-x-3 p-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedCamera?.cameraId === cam.cameraId
                    ? 'bg-emerald-50/70 border border-emerald-200'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                {/* Camera Label */}
                <div className="w-24 shrink-0 text-left">
                  <div className="text-[11px] font-bold text-slate-800 truncate">{cam.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{cam.cameraId}</div>
                </div>

                {/* Thumbnail Track Strip */}
                <div className="flex-1 h-8 flex items-center space-x-1 overflow-hidden bg-slate-100 rounded-md p-0.5 border border-slate-200/80">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((idx) => (
                    <div
                      key={idx}
                      className="relative h-full flex-1 rounded overflow-hidden group bg-slate-900 shrink-0"
                    >
                      <img
                        src={cam.imageUrl}
                        alt="frame"
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                      {/* Event highlight tag */}
                      {idx === 7 && cam.cameraId === 'CAM03' && (
                        <span className="absolute inset-0 border border-red-500 bg-red-500/20" title="Low stock detected"></span>
                      )}
                      {idx === 5 && cam.cameraId === 'CAM02' && (
                        <span className="absolute inset-0 border border-amber-500 bg-amber-500/20" title="Crowd cluster"></span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 4 Cols: Event List matching reference */}
        <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-200 lg:pl-6">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <h3 className="text-xs font-extrabold text-slate-800">Event List</h3>
            <div className="flex items-center space-x-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value as any)}
                className="text-[11px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 font-medium"
              >
                <option value="ALL">Filters (All)</option>
                <option value="Critical">Critical</option>
                <option value="Warning">Warning</option>
                <option value="Info">Info</option>
                <option value="Success">Success</option>
              </select>
            </div>
          </div>

          {/* Event items feed */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {filteredEvents.slice(0, 6).map((evt, idx) => {
              const Icon =
                evt.severity === 'Critical'
                  ? AlertCircle
                  : evt.severity === 'Warning'
                  ? AlertTriangle
                  : evt.severity === 'Success'
                  ? CheckCircle2
                  : Clock;

              const iconColor =
                evt.severity === 'Critical'
                  ? 'text-red-600 bg-red-50'
                  : evt.severity === 'Warning'
                  ? 'text-amber-600 bg-amber-50'
                  : evt.severity === 'Success'
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-slate-600 bg-slate-50';

              return (
                <div
                  key={idx}
                  className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-50/80 hover:bg-slate-100/80 border border-slate-100 transition-colors"
                >
                  <div className={`p-1 rounded-md shrink-0 ${iconColor}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono text-slate-400">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-slate-400 text-[9px] font-mono">{evt.cameraId}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 leading-tight truncate">
                      {evt.title}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight truncate mt-0.5">
                      {evt.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
