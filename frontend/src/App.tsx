import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { CamerasPage } from './pages/CamerasPage';
import { ShopperAnalyticsPage } from './pages/ShopperAnalyticsPage';
import { InventoryPage } from './pages/InventoryPage';
import { QueuePage } from './pages/QueuePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { MultiStorePage } from './pages/MultiStorePage';
import { ReportsPage } from './pages/ReportsPage';
import { fetchNotifications } from './services/api';
import { getSocket } from './services/socket';

export function App() {
  const [unreadCount, setUnreadCount] = useState(3);

  useEffect(() => {
    fetchNotifications(10).then((res) => {
      if (res && res.unreadCount !== undefined) {
        setUnreadCount(res.unreadCount);
      }
    }).catch(() => {});

    const socket = getSocket();
    const handleNotifNew = () => {
      setUnreadCount((c) => c + 1);
    };
    const handleStatus = (s: any) => {
      if (s.unreadNotifications !== undefined) {
        setUnreadCount(s.unreadNotifications);
      }
    };

    socket.on('notification:new', handleNotifNew);
    socket.on('system:status', handleStatus);

    return () => {
      socket.off('notification:new', handleNotifNew);
      socket.off('system:status', handleStatus);
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
        {/* Dark Sidebar */}
        <Sidebar unreadCount={unreadCount} />

        {/* Main Content Area */}
        <Routes>
          <Route path="/" element={<Navigate to="/cameras" replace />} />
          <Route path="/cameras" element={<CamerasPage />} />
          <Route path="/shoppers" element={<ShopperAnalyticsPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/queue" element={<QueuePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/multi-store" element={<MultiStorePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          {/* Future routes — placeholder redirects */}
          <Route path="*" element={<Navigate to="/cameras" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
