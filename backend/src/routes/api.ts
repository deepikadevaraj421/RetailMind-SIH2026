import { Router, Request, Response } from 'express';
import { z } from 'zod';
import axios from 'axios';
import { CameraService, NotificationService, TimelineService, inMemoryStore, isDbConnected, ShopperService, KpiService, InventoryService, QueueService } from '../services/dataStore.js';
import { SettingsService } from '../services/settingsService.js';
import { MultiStoreService } from '../services/multiStoreService.js';
import { ReportService } from '../services/reportService.js';
import { getDBStatus } from '../utils/db.js';
import { simulationEngine } from '../simulation/simulationEngine.js';
import { Server } from 'socket.io';

export const createApiRouter = (io: Server): Router => {
  const router = Router();

  // 1. HEALTH (Section 78)
  router.get('/health', async (req: Request, res: Response) => {
    let mlStatus = 'offline';
    try {
      const mlRes = await axios.get(`${process.env.ML_SERVICE_URL || 'http://localhost:8000'}/health`, { timeout: 1500 });
      if (mlRes.data && mlRes.data.status) {
        mlStatus = mlRes.data.status;
      }
    } catch (e) {
      mlStatus = 'unavailable';
    }

    const db = getDBStatus();
    const sim = simulationEngine.getStatus();

    res.json({
      api: 'ok',
      mongodb: db.isConnected ? 'connected' : 'disconnected (using resilient store)',
      ml: mlStatus,
      simulation: sim.running ? 'running' : 'stopped',
      socket: 'connected',
      timestamp: new Date()
    });
  });

  // 2. SYSTEM STATUS (Section 43)
  router.get('/system/status', async (req: Request, res: Response) => {
    const db = getDBStatus();
    let mlDetails: any = { status: 'offline' };
    try {
      const mlRes = await axios.get(`${process.env.ML_SERVICE_URL || 'http://localhost:8000'}/health`, { timeout: 1500 });
      mlDetails = mlRes.data;
    } catch (e) {}

    const unreadCount = await NotificationService.getUnreadCount();

    res.json({
      edgeAiConnected: true,
      store: {
        storeId: 'STORE001',
        name: 'Chennai – Anna Nagar',
        status: 'Store Online (Edge AI)'
      },
      mongodb: {
        status: db.status,
        isConnected: db.isConnected,
        database: db.dbName
      },
      mlService: mlDetails,
      simulation: simulationEngine.getStatus(),
      unreadNotifications: unreadCount,
      lastSync: new Date()
    });
  });

  // 3. CAMERAS LIST + FILTERS (Section 11, 12, 44)
  router.get('/cameras', async (req: Request, res: Response) => {
    try {
      const { type, search } = req.query;
      const cameras = await CameraService.getAll({ type, search });
      const counts = await CameraService.getCounts();
      res.json({
        success: true,
        counts,
        data: cameras
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 4. CAMERA COUNTS
  router.get('/cameras/counts', async (req: Request, res: Response) => {
    const counts = await CameraService.getCounts();
    res.json({ success: true, counts });
  });

  // 5. CAMERA BY ID (Section 44, 59)
  router.get('/cameras/:id', async (req: Request, res: Response) => {
    try {
      const cam = await CameraService.getById(req.params.id as string);
      if (!cam) {
        return res.status(404).json({ success: false, message: 'Camera not found' });
      }
      res.json({ success: true, data: cam });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 6. ADD CAMERA (Section 13)
  const addCameraSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    cameraId: z.string().min(2, 'Camera ID must be at least 2 characters'),
    location: z.string().min(2, 'Location is required'),
    type: z.enum(['ENTRANCE', 'SHELF', 'CHECKOUT', 'FLOOR']),
    zone: z.string().optional().default(''),
    resolution: z.string().optional().default('1080p'),
    imageUrl: z.string().url('A valid image URL is required'),
    streamUrl: z.string().optional().default(''),
    status: z.enum(['ONLINE', 'OFFLINE']).optional().default('ONLINE'),
    aiModules: z.array(z.string()).optional().default([])
  });

  router.post('/cameras', async (req: Request, res: Response) => {
    try {
      const parsed = addCameraSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, errors: parsed.error.errors });
      }

      const existing = await CameraService.getById(parsed.data.cameraId);
      if (existing) {
        return res.status(409).json({ success: false, message: `Camera ID ${parsed.data.cameraId} already exists` });
      }

      const created = await CameraService.create(parsed.data);

      // Emit Socket.IO updates
      io.emit('camera:new', created);
      const counts = await CameraService.getCounts();
      io.emit('camera:counts', counts);

      res.status(201).json({
        success: true,
        message: 'Camera added successfully',
        data: created
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 7. PATCH CAMERA
  router.patch('/cameras/:id', async (req: Request, res: Response) => {
    try {
      const updated = await CameraService.update(req.params.id as string, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Camera not found' });
      }
      io.emit('camera:update', updated);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 8. TOGGLE CAMERA STATUS (ONLINE / OFFLINE) (Section 76)
  router.post('/cameras/:id/toggle-status', async (req: Request, res: Response) => {
    try {
      const cam = await simulationEngine.toggleCameraStatus((req.params.id as string).toUpperCase(), req.body.status);
      if (!cam) {
        return res.status(404).json({ success: false, message: 'Camera not found' });
      }
      res.json({ success: true, data: cam });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 9. TIMELINE EVENTS (Section 45)
  router.get('/timeline', async (req: Request, res: Response) => {
    try {
      const { cameraId, severity } = req.query;
      const events = await TimelineService.getEvents({ cameraId, severity });
      res.json({ success: true, data: events });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 10. NOTIFICATIONS
  router.get('/notifications', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
      const notifications = await NotificationService.getRecent(limit);
      const unreadCount = await NotificationService.getUnreadCount();
      res.json({ success: true, unreadCount, data: notifications });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.patch('/notifications/:id/status', async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const item = await NotificationService.updateStatus(req.params.id as string, status);
      if (!item) return res.status(404).json({ success: false, message: 'Notification not found' });
      io.emit('notification:updated', item);
      res.json({ success: true, data: item });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 11. ML PROXIES
  router.post('/ml/queue/predict', async (req: Request, res: Response) => {
    try {
      const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
      const response = await axios.post(`${mlUrl}/predict/queue`, req.body, { timeout: 3000 });
      res.json({ success: true, data: response.data });
    } catch (err: any) {
      res.status(502).json({ success: false, message: 'ML service unavailable or error', error: err.message });
    }
  });

  router.post('/ml/inventory/predict', async (req: Request, res: Response) => {
    try {
      const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
      const response = await axios.post(`${mlUrl}/predict/inventory`, req.body, { timeout: 3000 });
      res.json({ success: true, data: response.data });
    } catch (err: any) {
      res.status(502).json({ success: false, message: 'ML service unavailable or error', error: err.message });
    }
  });

  // 12. SHOPPER ANALYTICS — Zone data
  router.get('/analytics/shoppers/zones', (req: Request, res: Response) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const zone = req.query.zone as string | undefined;
      const data = ShopperService.getZoneData({ days, zone });
      res.json({ success: true, count: data.length, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 13. SHOPPER ANALYTICS — Summary Stats
  router.get('/analytics/shoppers/summary', (req: Request, res: Response) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const stats = ShopperService.getSummaryStats(days);
      res.json({ success: true, data: stats });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 14. DAILY KPIs
  router.get('/analytics/kpis', (req: Request, res: Response) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const data = KpiService.getKpis({ days });
      const latest = KpiService.getLatestKpi();
      res.json({ success: true, count: data.length, latest, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 15. FOOTFALL TREND — daily entry counts from Entrance zone
  router.get('/analytics/shoppers/footfall-trend', (req: Request, res: Response) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const data = ShopperService.getZoneData({ days, zone: 'Entrance' });
      const trend = data.map(d => ({
        date: d.date instanceof Date ? d.date.toISOString().split('T')[0] : String(d.date).split('T')[0],
        visitors: d.visitors,
        high_traffic: d.high_traffic_flag
      }));
      res.json({ success: true, data: trend });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 16. ZONE BREAKDOWN — avg visitors per zone for the period
  router.get('/analytics/shoppers/zone-breakdown', (req: Request, res: Response) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const allData = ShopperService.getZoneData({ days });

      const zoneMap: Record<string, { totalVisitors: number; totalDwell: number; count: number; highTrafficDays: number }> = {};
      for (const d of allData) {
        if (!zoneMap[d.zone]) zoneMap[d.zone] = { totalVisitors: 0, totalDwell: 0, count: 0, highTrafficDays: 0 };
        zoneMap[d.zone].totalVisitors += d.visitors || 0;
        zoneMap[d.zone].totalDwell += d.avg_dwell_minutes || 0;
        zoneMap[d.zone].count += 1;
        if (d.high_traffic_flag) zoneMap[d.zone].highTrafficDays += 1;
      }

      const result = Object.entries(zoneMap)
        .map(([zone, v]) => ({
          zone,
          avgVisitors: Math.round(v.totalVisitors / Math.max(days, 1)),
          totalVisitors: v.totalVisitors,
          avgDwellMinutes: parseFloat((v.totalDwell / v.count).toFixed(2)),
          highTrafficDays: v.highTrafficDays,
          highTrafficPct: parseFloat(((v.highTrafficDays / v.count) * 100).toFixed(1))
        }))
        .sort((a, b) => b.totalVisitors - a.totalVisitors);

      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS BATCH ACTIONS (Dashboard 5)
  // ═══════════════════════════════════════════════════════════════════════════
  router.post('/notifications/mark-all-read', async (req: Request, res: Response) => {
    try {
      const result = await NotificationService.markAllAsRead();
      io.emit('system:status', { unreadNotifications: 0 });
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INVENTORY & SHELVES APIS (Dashboard 3)
  // ═══════════════════════════════════════════════════════════════════════════
  router.get('/inventory/summary', (req: Request, res: Response) => {
    try {
      const summary = InventoryService.getSummary();
      res.json({ success: true, data: summary });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/inventory/health', (req: Request, res: Response) => {
    try {
      const health = InventoryService.getHealthOverview();
      res.json({ success: true, data: health });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/inventory/categories', (req: Request, res: Response) => {
    try {
      const categories = InventoryService.getCategoryBreakdown();
      res.json({ success: true, data: categories });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/inventory/alerts', (req: Request, res: Response) => {
    try {
      const alerts = InventoryService.getRecentAlerts();
      res.json({ success: true, data: alerts });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/inventory/shelf-cameras', (req: Request, res: Response) => {
    try {
      const cams = InventoryService.getLiveShelfCameras();
      res.json({ success: true, data: cams });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/inventory/at-risk', (req: Request, res: Response) => {
    try {
      const atRisk = InventoryService.getAtRiskProducts();
      res.json({ success: true, data: atRisk });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/inventory/shelf/:id', (req: Request, res: Response) => {
    try {
      const detail = InventoryService.getShelfDetail(req.params.id as string);
      res.json({ success: true, data: detail });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/inventory/planogram', (req: Request, res: Response) => {
    try {
      const plano = InventoryService.getPlanogramBreakdown();
      res.json({ success: true, data: plano });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/inventory/replenishment', (req: Request, res: Response) => {
    try {
      const tasks = InventoryService.getReplenishmentTasks();
      res.json({ success: true, data: tasks });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.post('/inventory/shelf/:id/notify-staff', (req: Request, res: Response) => {
    try {
      const result = InventoryService.notifyStaff(req.params.id as string, req.body.note);
      io.emit('notification:new', {
        title: `Staff Dispatched to Shelf ${req.params.id}`,
        message: `Alert dispatched to store staff to refill Shelf ${req.params.id}.`,
        severity: 'Critical'
      });
      res.json({ success: true, message: result.message });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.post('/inventory/tasks/:id/assign', (req: Request, res: Response) => {
    try {
      const updated = InventoryService.assignTask(req.params.id as string);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // QUEUE & PREDICTIONS APIS (Dashboard 4)
  // ═══════════════════════════════════════════════════════════════════════════
  router.get('/queue/live', (req: Request, res: Response) => {
    try {
      const status = QueueService.getLiveStatus();
      res.json({ success: true, data: status });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/queue/predictions', (req: Request, res: Response) => {
    try {
      const minutes = req.query.minutes ? parseInt(req.query.minutes as string) : 10;
      const predictions = QueueService.getPredictions(minutes);
      res.json({ success: true, data: predictions });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/queue/insights', (req: Request, res: Response) => {
    try {
      const insights = QueueService.getInsights();
      res.json({ success: true, data: insights });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.post('/queue/counters/:id/toggle', (req: Request, res: Response) => {
    try {
      const counterId = parseInt(req.params.id as string);
      const updated = QueueService.toggleCounter(counterId);
      io.emit('queue:update', QueueService.getLiveStatus());
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CSV REPORT EXPORTS
  // ═══════════════════════════════════════════════════════════════════════════
  router.get('/reports/inventory/export', (req: Request, res: Response) => {
    const summary = InventoryService.getSummary();
    const atRisk = InventoryService.getAtRiskProducts();
    let csv = `RetailMind - Inventory & Shelves Report\n`;
    csv += `Store: Chennai – Anna Nagar, Date: ${new Date().toISOString().split('T')[0]}\n\n`;
    csv += `Metric,Value\n`;
    csv += `Inventory Availability,${summary.inventoryAvailabilityPct}%\n`;
    csv += `Out of Stock Count,${summary.outOfStockCount}\n`;
    csv += `Low Stock Count,${summary.lowStockCount}\n`;
    csv += `Planogram Compliance,${summary.planogramCompliancePct}%\n\n`;
    csv += `Product,Shelf,Current Stock,Expected Stock,Status\n`;
    for (const p of atRisk) {
      csv += `${p.product},${p.shelf},${p.current},${p.expected},${p.status}\n`;
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory_report.csv');
    res.send(csv);
  });

  router.get('/reports/queue/export', (req: Request, res: Response) => {
    const status = QueueService.getLiveStatus();
    let csv = `RetailMind - Queue & Predictions Report\n`;
    csv += `Store: Chennai – Anna Nagar, Date: ${new Date().toISOString().split('T')[0]}\n\n`;
    csv += `Total Queue Length,${status.totalQueueLength}\n`;
    csv += `Avg Waiting Time,${status.avgWaitingMinutes}\n`;
    csv += `Avg Service Time,${status.avgServiceMinutes}\n`;
    csv += `Active Counters,${status.activeCountersRatio}\n\n`;
    csv += `Counter,Status,People Count,Avg Wait\n`;
    for (const c of status.counters) {
      csv += `${c.name},${c.status},${c.peopleCount},${c.avgWait}\n`;
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=queue_report.csv');
    res.send(csv);
  });

  router.get('/reports/notifications/export', (req: Request, res: Response) => {
    let csv = `RetailMind - Notifications Report\n`;
    csv += `Store: Chennai – Anna Nagar, Exported: ${new Date().toISOString()}\n\n`;
    csv += `ID,Severity,Category,Title,Location,Status,Timestamp\n`;
    for (const n of inMemoryStore.notifications.slice(0, 100)) {
      csv += `"${n.notificationId}","${n.severity}","${n.category}","${n.title}","${n.location}","${n.status}","${new Date(n.generatedAt).toISOString()}"\n`;
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=notifications_report.csv');
    res.send(csv);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SETTINGS APIS (Dashboard 8)
  // ═══════════════════════════════════════════════════════════════════════════

  // Get current settings
  router.get('/settings', async (req: Request, res: Response) => {
    try {
      const storeId = (req.query.storeId as string) || 'STORE001';
      const settings = await SettingsService.getSettings(storeId);
      res.json({ success: true, data: settings });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Update Store Information (General tab)
  router.patch('/settings/general', async (req: Request, res: Response) => {
    try {
      const storeId = (req.query.storeId as string) || 'STORE001';
      const updated = await SettingsService.updateSection('storeInfo', req.body, storeId);
      res.json({ success: true, message: 'Store information updated successfully', data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Update System Preferences
  router.patch('/settings/preferences', async (req: Request, res: Response) => {
    try {
      const storeId = (req.query.storeId as string) || 'STORE001';
      const updated = await SettingsService.updateSection('preferences', req.body, storeId);
      res.json({ success: true, message: 'Preferences updated successfully', data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Update Store Branding / Colors
  router.patch('/settings/branding', async (req: Request, res: Response) => {
    try {
      const storeId = (req.query.storeId as string) || 'STORE001';
      const updated = await SettingsService.updateSection('branding', req.body, storeId);
      res.json({ success: true, message: 'Branding updated successfully', data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Update AI & Detection Settings
  router.patch('/settings/ai', async (req: Request, res: Response) => {
    try {
      const storeId = (req.query.storeId as string) || 'STORE001';
      const updated = await SettingsService.updateSection('aiDetection', req.body, storeId);
      res.json({ success: true, message: 'AI detection settings saved', data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Update Alert Preferences
  router.patch('/settings/alerts', async (req: Request, res: Response) => {
    try {
      const storeId = (req.query.storeId as string) || 'STORE001';
      const updated = await SettingsService.updateSection('alertPreferences', req.body, storeId);
      res.json({ success: true, message: 'Alert preferences saved', data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Update Backup Settings
  router.patch('/settings/backup', async (req: Request, res: Response) => {
    try {
      const storeId = (req.query.storeId as string) || 'STORE001';
      const updated = await SettingsService.updateSection('dataBackup', req.body, storeId);
      res.json({ success: true, message: 'Backup settings updated', data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Update Integration config
  router.patch('/settings/integrations/:key', async (req: Request, res: Response) => {
    try {
      const key = req.params.key as string;
      const storeId = (req.query.storeId as string) || 'STORE001';
      const current = await SettingsService.getSettings(storeId);
      const integrations = current.integrations || {};
      integrations[key] = {
        ...(integrations[key] || {}),
        ...req.body
      };
      const updated = await SettingsService.updateSection('integrations', integrations, storeId);
      res.json({ success: true, message: `${key} integration updated`, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Test Alert Dispatch
  router.post('/settings/test-alert', async (req: Request, res: Response) => {
    try {
      const { channel = 'In-App', recipient = 'Store Manager' } = req.body;
      const result = await SettingsService.testAlert(channel, recipient);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Test Integration Connection
  router.post('/settings/test-integration', async (req: Request, res: Response) => {
    try {
      const { integration } = req.body;
      if (!integration) {
        return res.status(400).json({ success: false, message: 'Integration key is required' });
      }
      const result = await SettingsService.testIntegration(integration);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Trigger Backup Now
  router.post('/settings/backup', async (req: Request, res: Response) => {
    try {
      const result = await SettingsService.createBackup();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Reset to Default Settings
  router.post('/settings/reset-defaults', async (req: Request, res: Response) => {
    try {
      const storeId = req.body.storeId || 'STORE001';
      const result = await SettingsService.resetDefaults(storeId);
      res.json({ success: true, message: 'Settings reset to system defaults', data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Danger Zone: Reset Store Data
  router.post('/settings/reset-store-data', async (req: Request, res: Response) => {
    try {
      const result = await SettingsService.resetStoreData();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Stores Registry List
  router.get('/stores', (req: Request, res: Response) => {
    try {
      const stores = SettingsService.getStores();
      res.json({ success: true, count: stores.length, data: stores });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Users & Access List
  router.get('/users', (req: Request, res: Response) => {
    try {
      const users = SettingsService.getUsers();
      res.json({ success: true, count: users.length, data: users });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ML Models & Evaluated Metrics
  router.get('/ml/models', (req: Request, res: Response) => {
    try {
      const models = SettingsService.getModels();
      res.json({ success: true, count: models.length, data: models });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MULTI-STORE APIS (Dashboard 7)
  // ═══════════════════════════════════════════════════════════════════════════

  router.get('/multistore/summary', (req: Request, res: Response) => {
    try {
      const summary = MultiStoreService.getSummary();
      res.json({ success: true, data: summary });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/multistore/performance', (req: Request, res: Response) => {
    try {
      const { search, region, status, performance } = req.query;
      const list = MultiStoreService.getStorePerformance({
        search: search as string,
        region: region as string,
        status: status as string,
        performance: performance as string
      });
      res.json({ success: true, count: list.length, data: list });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/multistore/footfall', (req: Request, res: Response) => {
    try {
      const period = (req.query.period as string) || 'Today';
      const data = MultiStoreService.getFootfallComparison(period);
      res.json({ success: true, period, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/multistore/attention', (req: Request, res: Response) => {
    try {
      const attention = MultiStoreService.getStoresNeedingAttention();
      res.json({ success: true, data: attention });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/multistore/health', (req: Request, res: Response) => {
    try {
      const health = MultiStoreService.getOverallHealth();
      res.json({ success: true, data: health });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/multistore/insights', (req: Request, res: Response) => {
    try {
      const insights = MultiStoreService.getAiInsights();
      res.json({ success: true, data: insights });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/multistore/activity', (req: Request, res: Response) => {
    try {
      const activity = MultiStoreService.getRecentActivity();
      res.json({ success: true, data: activity });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REPORTS DASHBOARD APIS (Dashboard 6)
  // ═══════════════════════════════════════════════════════════════════════════

  router.get('/reports/analytics', (req: Request, res: Response) => {
    try {
      const { reportType = 'Shopper Analytics', store = 'Chennai – Anna Nagar', period = 'Daily' } = req.query;
      const data = ReportService.getReportData(reportType as string, store as string, period as string);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/reports/analytics/csv', (req: Request, res: Response) => {
    try {
      const { reportType = 'Shopper Analytics', store = 'Chennai – Anna Nagar' } = req.query;
      const csv = ReportService.generateCsv(reportType as string, store as string);
      const filename = `RetailMind_${(reportType as string).replace(/\s+/g, '_')}_Report.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  return router;
};
