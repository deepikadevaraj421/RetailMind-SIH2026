import axios from 'axios';
import { Camera, CameraCounts, TimelineEventItem, NotificationItem, SystemStatus } from '../types';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

export const fetchCameras = async (params: { type?: string; search?: string } = {}) => {
  const res = await apiClient.get<{ success: boolean; counts: CameraCounts; data: Camera[] }>('/cameras', { params });
  return res.data;
};

export const fetchCameraById = async (id: string) => {
  const res = await apiClient.get<{ success: boolean; data: Camera }>(`/cameras/${id}`);
  return res.data.data;
};

export const createCamera = async (cameraData: Partial<Camera>) => {
  const res = await apiClient.post<{ success: boolean; message: string; data: Camera }>('/cameras', cameraData);
  return res.data;
};

export const toggleCameraStatus = async (id: string, status?: string) => {
  const res = await apiClient.post<{ success: boolean; data: Camera }>(`/cameras/${id}/toggle-status`, { status });
  return res.data.data;
};

export const fetchTimeline = async (params: { cameraId?: string; severity?: string } = {}) => {
  const res = await apiClient.get<{ success: boolean; data: TimelineEventItem[] }>('/timeline', { params });
  return res.data.data;
};

export const fetchNotifications = async (limit = 30) => {
  const res = await apiClient.get<{ success: boolean; unreadCount: number; data: NotificationItem[] }>('/notifications', { params: { limit } });
  return res.data;
};

export const updateNotificationStatus = async (notificationId: string, status: string) => {
  const res = await apiClient.patch<{ success: boolean; data: NotificationItem }>(`/notifications/${notificationId}/status`, { status });
  return res.data.data;
};

export const fetchHealth = async () => {
  const res = await apiClient.get<SystemStatus>('/health');
  return res.data;
};

// ── Shopper Analytics ────────────────────────────────────────────────────────

export const fetchShopperSummary = async (days = 30) => {
  const res = await apiClient.get<{ success: boolean; data: any }>('/analytics/shoppers/summary', { params: { days } });
  return res.data.data;
};

export const fetchFootfallTrend = async (days = 30) => {
  const res = await apiClient.get<{ success: boolean; data: any[] }>('/analytics/shoppers/footfall-trend', { params: { days } });
  return res.data.data;
};

export const fetchZoneBreakdown = async (days = 30) => {
  const res = await apiClient.get<{ success: boolean; data: any[] }>('/analytics/shoppers/zone-breakdown', { params: { days } });
  return res.data.data;
};

export const fetchDailyKpis = async (days = 30) => {
  const res = await apiClient.get<{ success: boolean; count: number; latest: any; data: any[] }>('/analytics/kpis', { params: { days } });
  return res.data;
};

export const fetchZoneData = async (days = 30, zone?: string) => {
  const res = await apiClient.get<{ success: boolean; count: number; data: any[] }>('/analytics/shoppers/zones', { params: { days, zone } });
  return res.data.data;
};

// ── Notifications ────────────────────────────────────────────────────────────

export const markAllNotificationsRead = async () => {
  const res = await apiClient.post<{ success: boolean; message: string }>('/notifications/mark-all-read');
  return res.data;
};

// ── Inventory & Shelves ──────────────────────────────────────────────────────

export const fetchInventorySummary = async () => {
  const res = await apiClient.get<{ success: boolean; data: any }>('/inventory/summary');
  return res.data.data;
};

export const fetchInventoryHealth = async () => {
  const res = await apiClient.get<{ success: boolean; data: any }>('/inventory/health');
  return res.data.data;
};

export const fetchInventoryCategories = async () => {
  const res = await apiClient.get<{ success: boolean; data: any[] }>('/inventory/categories');
  return res.data.data;
};

export const fetchInventoryAlerts = async () => {
  const res = await apiClient.get<{ success: boolean; data: any[] }>('/inventory/alerts');
  return res.data.data;
};

export const fetchInventoryShelfCameras = async () => {
  const res = await apiClient.get<{ success: boolean; data: any[] }>('/inventory/shelf-cameras');
  return res.data.data;
};

export const fetchInventoryAtRisk = async () => {
  const res = await apiClient.get<{ success: boolean; data: any[] }>('/inventory/at-risk');
  return res.data.data;
};

export const fetchInventoryShelfDetail = async (shelfId = 'A3') => {
  const res = await apiClient.get<{ success: boolean; data: any }>(`/inventory/shelf/${shelfId}`);
  return res.data.data;
};

export const fetchInventoryPlanogram = async () => {
  const res = await apiClient.get<{ success: boolean; data: any }>('/inventory/planogram');
  return res.data.data;
};

export const fetchInventoryReplenishment = async () => {
  const res = await apiClient.get<{ success: boolean; data: any[] }>('/inventory/replenishment');
  return res.data.data;
};

export const notifyStaffForShelf = async (shelfId: string, note?: string) => {
  const res = await apiClient.post<{ success: boolean; message: string }>(`/inventory/shelf/${shelfId}/notify-staff`, { note });
  return res.data;
};

export const assignReplenishmentTask = async (taskId: string) => {
  const res = await apiClient.post<{ success: boolean; data: any }>(`/inventory/tasks/${taskId}/assign`);
  return res.data.data;
};

// ── Queue & Predictions ──────────────────────────────────────────────────────

export const fetchQueueLive = async () => {
  const res = await apiClient.get<{ success: boolean; data: any }>('/queue/live');
  return res.data.data;
};

export const fetchQueuePredictions = async (minutes = 10) => {
  const res = await apiClient.get<{ success: boolean; data: any }>('/queue/predictions', { params: { minutes } });
  return res.data.data;
};

export const fetchQueueInsights = async () => {
  const res = await apiClient.get<{ success: boolean; data: any }>('/queue/insights');
  return res.data.data;
};

export const toggleQueueCounter = async (counterId = 4) => {
  const res = await apiClient.post<{ success: boolean; data: any }>(`/queue/counters/${counterId}/toggle`);
  return res.data.data;
};

// ── Settings & Stores ────────────────────────────────────────────────────────

export const fetchSettings = async (storeId = 'STORE001') => {
  const res = await apiClient.get<{ success: boolean; data: any }>('/settings', { params: { storeId } });
  return res.data.data;
};

export const updateSettingsGeneral = async (data: any, storeId = 'STORE001') => {
  const res = await apiClient.patch<{ success: boolean; message: string; data: any }>('/settings/general', data, { params: { storeId } });
  return res.data;
};

export const updateSettingsPreferences = async (data: any, storeId = 'STORE001') => {
  const res = await apiClient.patch<{ success: boolean; message: string; data: any }>('/settings/preferences', data, { params: { storeId } });
  return res.data;
};

export const updateSettingsBranding = async (data: any, storeId = 'STORE001') => {
  const res = await apiClient.patch<{ success: boolean; message: string; data: any }>('/settings/branding', data, { params: { storeId } });
  return res.data;
};

export const updateSettingsAi = async (data: any, storeId = 'STORE001') => {
  const res = await apiClient.patch<{ success: boolean; message: string; data: any }>('/settings/ai', data, { params: { storeId } });
  return res.data;
};

export const updateSettingsAlerts = async (data: any, storeId = 'STORE001') => {
  const res = await apiClient.patch<{ success: boolean; message: string; data: any }>('/settings/alerts', data, { params: { storeId } });
  return res.data;
};

export const updateSettingsBackup = async (data: any, storeId = 'STORE001') => {
  const res = await apiClient.patch<{ success: boolean; message: string; data: any }>('/settings/backup', data, { params: { storeId } });
  return res.data;
};

export const updateSettingsIntegration = async (key: string, data: any, storeId = 'STORE001') => {
  const res = await apiClient.patch<{ success: boolean; message: string; data: any }>(`/settings/integrations/${key}`, data, { params: { storeId } });
  return res.data;
};

export const testAlert = async (channel: string, recipient?: string) => {
  const res = await apiClient.post<{ success: boolean; channel: string; status: string; notificationId: string; message: string }>('/settings/test-alert', { channel, recipient });
  return res.data;
};

export const testIntegration = async (integration: string) => {
  const res = await apiClient.post<{ success: boolean; integration: string; status: string; latencyMs: number; message: string }>('/settings/test-integration', { integration });
  return res.data;
};

export const triggerBackup = async () => {
  const res = await apiClient.post<{ success: boolean; backupId: string; filename: string; sizeFormatted: string; timestamp: string; data: any }>('/settings/backup');
  return res.data;
};

export const resetSettingsDefault = async (storeId = 'STORE001') => {
  const res = await apiClient.post<{ success: boolean; message: string; data: any }>('/settings/reset-defaults', { storeId });
  return res.data;
};

export const resetStoreData = async () => {
  const res = await apiClient.post<{ success: boolean; message: string }>('/settings/reset-store-data');
  return res.data;
};

export const fetchStores = async () => {
  const res = await apiClient.get<{ success: boolean; count: number; data: any[] }>('/stores');
  return res.data.data;
};

export const fetchUsers = async () => {
  const res = await apiClient.get<{ success: boolean; count: number; data: any[] }>('/users');
  return res.data.data;
};

export const fetchMlModels = async () => {
  const res = await apiClient.get<{ success: boolean; count: number; data: any[] }>('/ml/models');
  return res.data.data;
};

// ── Multi-Store APIs ─────────────────────────────────────────────────────────

export const fetchMultiStoreSummary = async () => {
  const res = await apiClient.get<{ success: boolean; data: any }>('/multistore/summary');
  return res.data.data;
};

export const fetchMultiStorePerformance = async (params: { search?: string; region?: string; status?: string; performance?: string } = {}) => {
  const res = await apiClient.get<{ success: boolean; count: number; data: any[] }>('/multistore/performance', { params });
  return res.data.data;
};

export const fetchMultiStoreFootfall = async (period = 'Today') => {
  const res = await apiClient.get<{ success: boolean; period: string; data: any[] }>('/multistore/footfall', { params: { period } });
  return res.data.data;
};

export const fetchMultiStoreAttention = async () => {
  const res = await apiClient.get<{ success: boolean; data: any[] }>('/multistore/attention');
  return res.data.data;
};

export const fetchMultiStoreHealth = async () => {
  const res = await apiClient.get<{ success: boolean; data: any }>('/multistore/health');
  return res.data.data;
};

export const fetchMultiStoreInsights = async () => {
  const res = await apiClient.get<{ success: boolean; data: any[] }>('/multistore/insights');
  return res.data.data;
};

export const fetchMultiStoreActivity = async () => {
  const res = await apiClient.get<{ success: boolean; data: any[] }>('/multistore/activity');
  return res.data.data;
};

// ── Reports APIs ─────────────────────────────────────────────────────────────

export const fetchReportData = async (params: { reportType?: string; store?: string; period?: string } = {}) => {
  const res = await apiClient.get<{ success: boolean; data: any }>('/reports/analytics', { params });
  return res.data.data;
};



