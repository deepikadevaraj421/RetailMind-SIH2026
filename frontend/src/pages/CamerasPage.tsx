import React, { useState, useEffect, useCallback } from 'react';
import { Camera, CameraCounts, CameraType, TimelineEventItem, NotificationItem } from '../types';
import { fetchCameras, fetchTimeline, fetchNotifications } from '../services/api';
import { getSocket } from '../services/socket';
import { TopBar } from '../components/layout/TopBar';
import { PageHeader } from '../components/layout/PageHeader';
import { FilterBar } from '../components/cameras/FilterBar';
import { CameraGrid } from '../components/cameras/CameraGrid';
import { CameraDetailsPanel } from '../components/cameras/CameraDetailsPanel';
import { TimelineSection } from '../components/timeline/TimelineSection';
import { AddCameraModal } from '../components/cameras/AddCameraModal';
import { FullscreenModal } from '../components/common/FullscreenModal';
import { AlertToast } from '../components/common/AlertToast';

export const CamerasPage: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [counts, setCounts] = useState<CameraCounts>({ all: 0, entrance: 0, shelves: 0, checkout: 0, floor: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | CameraType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [fullscreenCamera, setFullscreenCamera] = useState<Camera | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [timelineEvents, setTimelineEvents] = useState<TimelineEventItem[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);

  // Mode: Live vs Playback
  const [mode, setMode] = useState<'live' | 'playback'>('live');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('06:00 AM – 11:59 PM');
  const [lastSyncText, setLastSyncText] = useState('2 min ago');

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [camData, timelineData, notifData] = await Promise.all([
        fetchCameras(),
        fetchTimeline(),
        fetchNotifications(20),
      ]);

      setCameras(camData.data);
      setCounts(camData.counts);
      setTimelineEvents(timelineData);
      setUnreadNotifications(notifData.unreadCount);

      // Default select Cam 03 (Shelf A3) matching reference screenshot
      const defaultCam = camData.data.find((c) => c.cameraId === 'CAM03') || camData.data[0];
      if (defaultCam) {
        setSelectedCamera(defaultCam);
      }
    } catch (err) {
      console.error('Failed to load cameras or timeline data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time Socket.IO Listeners (active in live mode)
  useEffect(() => {
    const socket = getSocket();

    const handleCameraUpdate = (updatedCam: Camera) => {
      // In live mode, update feeds in real time
      if (mode === 'live') {
        setCameras((prev) =>
          prev.map((c) => (c.cameraId === updatedCam.cameraId ? updatedCam : c))
        );
        setSelectedCamera((prev) =>
          prev?.cameraId === updatedCam.cameraId ? updatedCam : prev
        );
        if (fullscreenCamera?.cameraId === updatedCam.cameraId) {
          setFullscreenCamera(updatedCam);
        }
      }
    };

    const handleCameraNew = (newCam: Camera) => {
      setCameras((prev) => [newCam, ...prev]);
    };

    const handleCounts = (newCounts: CameraCounts) => {
      setCounts(newCounts);
    };

    const handleTimelineUpdate = (evt: TimelineEventItem) => {
      setTimelineEvents((prev) => [evt, ...prev]);
    };

    const handleNotificationNew = (notif: NotificationItem) => {
      setUnreadNotifications((prev) => prev + 1);
      setActiveToast(notif);
    };

    const handleSystemStatus = (status: any) => {
      if (status.unreadNotifications !== undefined) {
        setUnreadNotifications(status.unreadNotifications);
      }
      setLastSyncText('just now');
    };

    socket.on('camera:update', handleCameraUpdate);
    socket.on('camera:new', handleCameraNew);
    socket.on('camera:counts', handleCounts);
    socket.on('timeline:update', handleTimelineUpdate);
    socket.on('notification:new', handleNotificationNew);
    socket.on('system:status', handleSystemStatus);

    return () => {
      socket.off('camera:update', handleCameraUpdate);
      socket.off('camera:new', handleCameraNew);
      socket.off('camera:counts', handleCounts);
      socket.off('timeline:update', handleTimelineUpdate);
      socket.off('notification:new', handleNotificationNew);
      socket.off('system:status', handleSystemStatus);
    };
  }, [mode, fullscreenCamera]);

  // Handle Playback Scrubber Time changes
  const handleScrubTimeChange = useCallback((timeStr: string) => {
    // When user scrubs in playback mode, switch camera frames to simulated historical snapshots
    setCameras((prev) =>
      prev.map((cam) => {
        if (cam.snapshots && cam.snapshots.length > 1) {
          // Alternate snapshot based on scrub time
          const snapshotIdx = timeStr.includes('AM') || parseInt(timeStr.split(':')[0]) < 2 ? 0 : 1;
          const chosen = cam.snapshots[snapshotIdx % cam.snapshots.length];
          return {
            ...cam,
            imageUrl: chosen ? chosen.url : cam.imageUrl,
            lastUpdated: new Date().toISOString(),
          };
        }
        return cam;
      })
    );
  }, []);

  // Filter & Search logic
  const filteredCameras = React.useMemo(() => {
    let result = [...cameras];

    if (activeTab !== 'ALL') {
      result = result.filter((c) => c.type === activeTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.cameraId.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          (c.zone && c.zone.toLowerCase().includes(q)) ||
          c.type.toLowerCase().includes(q)
      );
    }

    return result;
  }, [cameras, activeTab, searchQuery]);

  // Events specific to selected camera
  const selectedCameraEvents = React.useMemo(() => {
    if (!selectedCamera) return [];
    return timelineEvents.filter((e) => e.cameraId === selectedCamera.cameraId);
  }, [timelineEvents, selectedCamera]);

  const handleCameraAdded = (newCam: Camera) => {
    setCameras((prev) => [newCam, ...prev]);
    setSelectedCamera(newCam);
  };

  const handleSendAlert = (cam: Camera) => {
    // Manual escalation alert
    const manualEvt: TimelineEventItem = {
      timestamp: new Date().toISOString(),
      cameraId: cam.cameraId,
      eventType: 'MANUAL_ALERT',
      severity: 'Critical',
      title: `Manual alert triggered for ${cam.name}`,
      description: `Store Manager issued manual priority alert for ${cam.location}`,
      status: 'active',
    };
    setTimelineEvents((prev) => [manualEvt, ...prev]);
    setActiveToast({
      notificationId: `MANUAL_${Date.now()}`,
      storeId: 'STORE001',
      cameraId: cam.cameraId,
      severity: 'Critical',
      category: 'System',
      title: `Manual Alert Dispatched: ${cam.name}`,
      message: `Supervisor dispatched notification to ${cam.location}.`,
      recipient: 'Store Staff',
      status: 'Sent',
      generatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 min-h-screen">
      {/* Top Bar */}
      <TopBar
        unreadCount={unreadNotifications}
        lastSyncedText={lastSyncText}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Page Header with Interactive Calendar & Time Window */}
      <PageHeader
        mode={mode}
        onModeChange={setMode}
        selectedDateText={selectedDate}
        onDateChange={setSelectedDate}
        selectedTimeRange={selectedTimeRange}
        onTimeRangeChange={setSelectedTimeRange}
      />

      {/* Filter and Control Bar */}
      <FilterBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={counts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddCameraClick={() => setIsAddModalOpen(true)}
      />

      {/* Main Content Area: Camera Grid on Left, Sticky Details Panel on Right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Camera Feeds Area */}
        <main className="flex-1 overflow-y-auto">
          <CameraGrid
            cameras={filteredCameras}
            isLoading={isLoading}
            selectedCamera={selectedCamera}
            onSelectCamera={setSelectedCamera}
            onFullscreenCamera={setFullscreenCamera}
            viewMode={viewMode}
          />
        </main>

        {/* Right Details Panel */}
        {selectedCamera && (
          <aside className="hidden lg:block">
            <CameraDetailsPanel
              camera={selectedCamera}
              onClose={() => setSelectedCamera(null)}
              onFullscreen={setFullscreenCamera}
              onSendAlert={handleSendAlert}
              cameraEvents={selectedCameraEvents}
            />
          </aside>
        )}
      </div>

      {/* Bottom Timeline Section */}
      <TimelineSection
        cameras={cameras}
        events={timelineEvents}
        selectedCamera={selectedCamera}
        onSelectCamera={setSelectedCamera}
        isPlaybackMode={mode === 'playback'}
        onTogglePlaybackMode={setMode}
        onScrubTimeChange={handleScrubTimeChange}
        selectedTimeRange={selectedTimeRange}
        selectedDate={selectedDate}
      />

      {/* Modals & Real-time Toast */}
      <AddCameraModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCameraAdded={handleCameraAdded}
      />

      <FullscreenModal
        camera={fullscreenCamera}
        onClose={() => setFullscreenCamera(null)}
      />

      <AlertToast
        notification={activeToast}
        onDismiss={() => setActiveToast(null)}
      />
    </div>
  );
};
