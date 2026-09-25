import { Camera, Notification, TimelineEvent, QueueMetric, Inventory, Store } from '../models/index.js';
import mongoose from 'mongoose';

// In-memory cache loaded from dataset and simulation
export interface CachedData {
  cameras: any[];
  notifications: any[];
  timelineEvents: any[];
  queueMetrics: any[];
  inventory: any[];
  stores: any[];
  shopperZoneData: any[];
  dailyKpiData: any[];
  inventoryData: any[];
  queueHistoryData: any[];
  replenishmentTasks: any[];
}

export const inMemoryStore: CachedData = {
  cameras: [],
  notifications: [],
  timelineEvents: [],
  queueMetrics: [],
  inventory: [],
  stores: [],
  shopperZoneData: [],
  dailyKpiData: [],
  inventoryData: [],
  queueHistoryData: [],
  replenishmentTasks: []
};

export const isDbConnected = (): boolean => mongoose.connection.readyState === 1;

export const CameraService = {
  async getAll(query: any = {}) {
    if (isDbConnected()) {
      try {
        const filter: any = {};
        if (query.type && query.type !== 'ALL') {
          filter.type = query.type;
        }
        if (query.search) {
          const s = new RegExp(query.search, 'i');
          filter.$or = [
            { name: s },
            { cameraId: s },
            { location: s },
            { zone: s },
            { type: s }
          ];
        }
        return await Camera.find(filter).sort({ cameraId: 1 }).lean();
      } catch (e) {
        console.warn('[DB] Fallback to cache for getAll cameras');
      }
    }

    let list = [...inMemoryStore.cameras];
    if (query.type && query.type !== 'ALL') {
      list = list.filter(c => c.type.toUpperCase() === query.type.toUpperCase());
    }
    if (query.search) {
      const s = query.search.toLowerCase();
      list = list.filter(c => 
        (c.name && c.name.toLowerCase().includes(s)) ||
        (c.cameraId && c.cameraId.toLowerCase().includes(s)) ||
        (c.location && c.location.toLowerCase().includes(s)) ||
        (c.zone && c.zone.toLowerCase().includes(s)) ||
        (c.type && c.type.toLowerCase().includes(s)) ||
        (c.productName && c.productName.toLowerCase().includes(s))
      );
    }
    return list;
  },

  async getById(id: string) {
    if (isDbConnected()) {
      try {
        const cam = await Camera.findOne({ cameraId: id.toUpperCase() }).lean();
        if (cam) return cam;
      } catch (e) {}
    }
    return inMemoryStore.cameras.find(c => c.cameraId.toUpperCase() === id.toUpperCase()) || null;
  },

  async create(data: any) {
    const newCam = {
      ...data,
      cameraId: data.cameraId.toUpperCase(),
      storeId: data.storeId || 'STORE001',
      status: data.status || 'ONLINE',
      peopleCount: data.peopleCount || 0,
      queueLength: data.queueLength || 0,
      currentStock: data.currentStock || 0,
      expectedStock: data.expectedStock || 0,
      stockStatus: data.stockStatus || 'Healthy',
      density: data.density || 'Normal',
      planogramCompliancePct: data.planogramCompliancePct || 100,
      misplacedItemsCount: data.misplacedItemsCount || 0,
      shelfHealthScore: data.shelfHealthScore || 100,
      activeAlerts: data.activeAlerts || [],
      lastUpdated: new Date()
    };

    if (isDbConnected()) {
      try {
        await Camera.findOneAndUpdate(
          { cameraId: newCam.cameraId },
          newCam,
          { upsert: true, new: true }
        );
      } catch (e) {
        console.error('[DB] Error saving camera to DB:', e);
      }
    }

    const idx = inMemoryStore.cameras.findIndex(c => c.cameraId === newCam.cameraId);
    if (idx >= 0) {
      inMemoryStore.cameras[idx] = newCam;
    } else {
      inMemoryStore.cameras.push(newCam);
    }
    return newCam;
  },

  async update(id: string, updateData: any) {
    updateData.lastUpdated = new Date();
    if (isDbConnected()) {
      try {
        await Camera.findOneAndUpdate({ cameraId: id.toUpperCase() }, updateData);
      } catch (e) {}
    }
    const idx = inMemoryStore.cameras.findIndex(c => c.cameraId.toUpperCase() === id.toUpperCase());
    if (idx >= 0) {
      inMemoryStore.cameras[idx] = { ...inMemoryStore.cameras[idx], ...updateData };
      return inMemoryStore.cameras[idx];
    }
    return null;
  },

  async getCounts() {
    const all = inMemoryStore.cameras;
    return {
      all: all.length,
      entrance: all.filter(c => c.type === 'ENTRANCE').length,
      shelves: all.filter(c => c.type === 'SHELF').length,
      checkout: all.filter(c => c.type === 'CHECKOUT').length,
      floor: all.filter(c => c.type === 'FLOOR').length
    };
  }
};

export const NotificationService = {
  async getRecent(limit = 20) {
    if (isDbConnected()) {
      try {
        return await Notification.find().sort({ generatedAt: -1 }).limit(limit).lean();
      } catch (e) {}
    }
    return [...inMemoryStore.notifications]
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
      .slice(0, limit);
  },

  async getUnreadCount() {
    if (isDbConnected()) {
      try {
        return await Notification.countDocuments({ status: { $in: ['Generated', 'Sent'] } });
      } catch (e) {}
    }
    return inMemoryStore.notifications.filter(n => n.status === 'Generated' || n.status === 'Sent').length;
  },

  async create(notificationData: any) {
    const notif = {
      notificationId: notificationData.notificationId || `NTF${Date.now()}`,
      storeId: notificationData.storeId || 'STORE001',
      cameraId: notificationData.cameraId,
      severity: notificationData.severity || 'Info',
      category: notificationData.category || 'System',
      title: notificationData.title,
      message: notificationData.message,
      subject: notificationData.subject || notificationData.title,
      location: notificationData.location || '',
      recipient: notificationData.recipient || 'Store Manager',
      status: notificationData.status || 'Sent',
      generatedAt: notificationData.generatedAt || new Date(),
      sentAt: notificationData.sentAt || new Date()
    };

    if (isDbConnected()) {
      try {
        await Notification.create(notif);
      } catch (e) {}
    }
    inMemoryStore.notifications.unshift(notif);
    if (inMemoryStore.notifications.length > 500) {
      inMemoryStore.notifications.pop();
    }
    return notif;
  },

  async updateStatus(notificationId: string, status: 'Generated' | 'Sent' | 'Acknowledged' | 'Resolved') {
    const updateObj: any = { status };
    if (status === 'Acknowledged') updateObj.acknowledgedAt = new Date();
    if (status === 'Resolved') updateObj.resolvedAt = new Date();

    if (isDbConnected()) {
      try {
        await Notification.findOneAndUpdate({ notificationId }, updateObj);
      } catch (e) {}
    }
    const item = inMemoryStore.notifications.find(n => n.notificationId === notificationId);
    if (item) {
      Object.assign(item, updateObj);
    }
    return item;
  },

  async markAllAsRead() {
    if (isDbConnected()) {
      try {
        await Notification.updateMany({ status: { $in: ['Generated', 'Sent'] } }, { status: 'Acknowledged', acknowledgedAt: new Date() });
      } catch (e) {}
    }
    for (const n of inMemoryStore.notifications) {
      if (n.status === 'Generated' || n.status === 'Sent') {
        n.status = 'Acknowledged';
        n.acknowledgedAt = new Date();
      }
    }
    return { success: true, unreadCount: 0 };
  }
};

export const TimelineService = {
  async getEvents(query: any = {}) {
    let list = [...inMemoryStore.timelineEvents];
    if (query.cameraId) {
      list = list.filter(e => e.cameraId === query.cameraId);
    }
    if (query.severity) {
      list = list.filter(e => e.severity.toLowerCase() === query.severity.toLowerCase());
    }
    return list
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50);
  },

  async createEvent(eventData: any) {
    const item = {
      timestamp: eventData.timestamp || new Date(),
      cameraId: eventData.cameraId,
      eventType: eventData.eventType,
      severity: eventData.severity || 'Info',
      title: eventData.title,
      description: eventData.description,
      status: eventData.status || 'active',
      thumbnailUrl: eventData.thumbnailUrl || ''
    };

    if (isDbConnected()) {
      try {
        await TimelineEvent.create(item);
      } catch (e) {}
    }
    inMemoryStore.timelineEvents.unshift(item);
    if (inMemoryStore.timelineEvents.length > 500) {
      inMemoryStore.timelineEvents.pop();
    }
    return item;
  }
};

export const ShopperService = {
  // Returns daily zone-level shopper data, optionally filtered by date range
  getZoneData(params: { days?: number; zone?: string } = {}) {
    const days = params.days || 30;

    // Get unique dates from the dataset, sorted descending, take last `days`
    const allDates = [...new Set(
      inMemoryStore.shopperZoneData.map(d => {
        const dt = d.date instanceof Date ? d.date : new Date(d.date);
        return dt.toISOString().split('T')[0];
      })
    )].sort((a, b) => b.localeCompare(a)).slice(0, days);

    const dateSet = new Set(allDates);

    let data = inMemoryStore.shopperZoneData.filter(d => {
      const dt = d.date instanceof Date ? d.date : new Date(d.date);
      return dateSet.has(dt.toISOString().split('T')[0]);
    });

    if (params.zone && params.zone !== 'ALL') {
      data = data.filter(d => d.zone === params.zone);
    }

    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  // Summary stats for a given date range
  getSummaryStats(days = 30) {
    const allDates = [...new Set(
      inMemoryStore.shopperZoneData.map(d => {
        const dt = d.date instanceof Date ? d.date : new Date(d.date);
        return dt.toISOString().split('T')[0];
      })
    )].sort((a, b) => b.localeCompare(a)).slice(0, days);

    const dateSet = new Set(allDates);
    const filtered = inMemoryStore.shopperZoneData.filter(d => {
      const dt = d.date instanceof Date ? d.date : new Date(d.date);
      return dateSet.has(dt.toISOString().split('T')[0]);
    });

    if (filtered.length === 0) return null;

    // Total unique dates
    const dates = allDates;

    // Aggregate per zone
    const zoneMap: Record<string, { totalVisitors: number; totalDwell: number; count: number; highTrafficDays: number }> = {};
    for (const d of filtered) {
      if (!zoneMap[d.zone]) zoneMap[d.zone] = { totalVisitors: 0, totalDwell: 0, count: 0, highTrafficDays: 0 };
      zoneMap[d.zone].totalVisitors += d.visitors || 0;
      zoneMap[d.zone].totalDwell += d.avg_dwell_minutes || 0;
      zoneMap[d.zone].count += 1;
      if (d.high_traffic_flag) zoneMap[d.zone].highTrafficDays += 1;
    }

    const zones = Object.entries(zoneMap).map(([zone, v]) => ({
      zone,
      avgVisitors: Math.round(v.totalVisitors / Math.max(dates.length, 1)),
      avgDwell: parseFloat((v.totalDwell / v.count).toFixed(1)),
      highTrafficDays: v.highTrafficDays
    }));

    const totalFootfall = filtered.filter(d => d.zone === 'Entrance').reduce((s, d) => s + (d.visitors || 0), 0);
    const avgDwell = filtered.reduce((s, d) => s + (d.avg_dwell_minutes || 0), 0) / filtered.length;

    return {
      totalDays: dates.length,
      totalFootfall,
      avgDailyFootfall: Math.round(totalFootfall / Math.max(dates.length, 1)),
      avgDwellMinutes: parseFloat(avgDwell.toFixed(1)),
      zones
    };
  }
};

export const KpiService = {
  getKpis(params: { days?: number } = {}) {
    const days = params.days || 30;
    // Sort by date descending, take first `days` rows, then re-sort ascending
    return [...inMemoryStore.dailyKpiData]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, days)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  getLatestKpi() {
    if (inMemoryStore.dailyKpiData.length === 0) return null;
    return [...inMemoryStore.dailyKpiData].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// 8. INVENTORY SERVICE (Dashboard 3 matching Reference Image 1)
// ═════════════════════════════════════════════════════════════════════════════
export const InventoryService = {
  getSummary() {
    return {
      inventoryAvailabilityPct: 94.2,
      availabilityChangePct: 2.1,
      outOfStockCount: 3,
      outOfStockChange: 1,
      lowStockCount: 12,
      lowStockChange: -4,
      planogramCompliancePct: 92.0,
      planogramChangePct: 6.0,
      replenishmentPendingCount: inMemoryStore.replenishmentTasks.filter(t => t.status === 'Pending').length || 8,
      totalTrackedSkus: 380,
    };
  },

  getHealthOverview() {
    return {
      overallHealthScore: 86,
      rating: 'Good',
      healthyCount: 68,
      healthyPct: 72,
      needsAttentionCount: 18,
      needsAttentionPct: 19,
      criticalCount: 8,
      criticalPct: 9,
    };
  },

  getCategoryBreakdown() {
    return [
      { category: 'Beverages', available: 72, lowStock: 12, outOfStock: 6, total: 90 },
      { category: 'Dairy', available: 62, lowStock: 10, outOfStock: 4, total: 76 },
      { category: 'Snacks', available: 52, lowStock: 10, outOfStock: 3, total: 65 },
      { category: 'Personal Care', available: 40, lowStock: 6, outOfStock: 2, total: 48 },
      { category: 'Household', available: 44, lowStock: 6, outOfStock: 2, total: 52 },
      { category: 'Bakery', available: 32, lowStock: 4, outOfStock: 2, total: 38 },
    ];
  },

  getRecentAlerts() {
    return [
      {
        id: 'ALT001',
        title: 'Milk – Shelf A3',
        description: 'Out of stock detected',
        time: '10:24 AM',
        status: 'Staff notified',
        severity: 'Critical',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      },
      {
        id: 'ALT002',
        title: 'Coke 500ml – Shelf B2',
        description: 'Low stock (4 units left)',
        time: '10:18 AM',
        status: 'Task assigned',
        severity: 'Warning',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
      },
      {
        id: 'ALT003',
        title: 'Planogram issue – Shelf C1',
        description: 'Product misplaced',
        time: '09:52 AM',
        status: 'Under review',
        severity: 'Warning',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
      },
      {
        id: 'ALT004',
        title: 'Bread – Shelf D4',
        description: 'Replenishment completed',
        time: '09:30 AM',
        status: 'Resolved',
        severity: 'Info',
        badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
      }
    ];
  },

  getLiveShelfCameras() {
    return [
      {
        cameraId: 'CAM03',
        cameraName: 'Cam 02 – Shelf A3',
        product: 'Milk',
        status: 'Out of Stock',
        badgeColor: 'bg-red-500',
        imageUrl: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&auto=format&fit=crop&q=80'
      },
      {
        cameraId: 'CAM04',
        cameraName: 'Cam 05 – Shelf B2',
        product: 'Coke 500ml',
        status: 'Low Stock',
        badgeColor: 'bg-amber-500',
        imageUrl: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=800&auto=format&fit=crop&q=80'
      },
      {
        cameraId: 'CAM05',
        cameraName: 'Cam 07 – Shelf C1',
        product: 'Snacks',
        status: 'Normal',
        badgeColor: 'bg-emerald-500',
        imageUrl: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=800&auto=format&fit=crop&q=80'
      }
    ];
  },

  getAtRiskProducts() {
    return [
      { product: 'Milk', shelf: 'A3', current: 0, expected: 10, status: 'Out of Stock', severity: 'Critical' },
      { product: 'Coke 500ml', shelf: 'B2', current: 4, expected: 12, status: 'Low Stock', severity: 'Warning' },
      { product: 'Bread', shelf: 'D4', current: 6, expected: 20, status: 'Low Stock', severity: 'Warning' },
      { product: 'Eggs', shelf: 'E1', current: 8, expected: 24, status: 'Low Stock', severity: 'Warning' },
      { product: 'Maggi Noodles', shelf: 'C3', current: 5, expected: 15, status: 'Low Stock', severity: 'Warning' }
    ];
  },

  getShelfDetail(shelfId = 'A3') {
    return {
      shelfId,
      product: 'Milk (1L)',
      sku: 'MILK001',
      category: 'Dairy',
      currentStock: 0,
      expectedStock: 10,
      predictedStockout: 'Already out',
      planogramStatus: '1 misplaced item',
      shelfHealthScore: 28,
      lastUpdated: '10:24 AM',
      status: 'Out of Stock',
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80'
    };
  },

  getPlanogramBreakdown() {
    return {
      compliancePct: 92,
      shelvesWithIssues: 7,
      misplacedCount: 4,
      missingCount: 2,
      extraCount: 1
    };
  },

  getReplenishmentTasks() {
    if (inMemoryStore.replenishmentTasks.length === 0) {
      inMemoryStore.replenishmentTasks = [
        { id: 'TASK001', product: 'Milk', shelf: 'A3', priority: 'High', status: 'Assigned', action: 'View' },
        { id: 'TASK002', product: 'Coke 500ml', shelf: 'B2', priority: 'High', status: 'Assigned', action: 'View' },
        { id: 'TASK003', product: 'Bread', shelf: 'D4', priority: 'Medium', status: 'Pending', action: 'Assign' },
        { id: 'TASK004', product: 'Eggs', shelf: 'E1', priority: 'Medium', status: 'Pending', action: 'Assign' }
      ];
    }
    return inMemoryStore.replenishmentTasks;
  },

  assignTask(taskId: string) {
    const task = inMemoryStore.replenishmentTasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'Assigned';
      task.action = 'View';
    }
    return task;
  },

  notifyStaff(shelfId: string, note?: string) {
    const alertItem = {
      notificationId: `NTF_${Date.now()}`,
      storeId: 'STORE001',
      cameraId: shelfId === 'A3' ? 'CAM03' : 'CAM04',
      severity: 'Critical',
      category: 'Inventory',
      title: `Staff Dispatched to Shelf ${shelfId}`,
      message: note || `Alert dispatched to store staff to refill Shelf ${shelfId}.`,
      subject: `Refill Shelf ${shelfId}`,
      location: `Shelf ${shelfId}`,
      recipient: 'Store Staff',
      status: 'Sent',
      generatedAt: new Date()
    };
    inMemoryStore.notifications.unshift(alertItem);
    return { success: true, message: `Staff will be notified to refill Shelf ${shelfId}.` };
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// 9. QUEUE SERVICE (Dashboard 4 matching Reference Image 2)
// ═════════════════════════════════════════════════════════════════════════════
export const QueueService = {
  counterState: [
    {
      id: 1,
      name: 'Counter 1',
      status: 'Live',
      peopleCount: 3,
      avgWait: '2m 10s',
      isLive: true,
      isCongested: false,
      imageUrl: 'https://images.unsplash.com/photo-1554415707-9e4966668834?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 2,
      name: 'Counter 2',
      status: 'Live',
      peopleCount: 8,
      avgWait: '6m 40s',
      isLive: true,
      isCongested: true,
      imageUrl: 'https://images.unsplash.com/photo-1579113800032-c38bd7635818?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 3,
      name: 'Counter 3',
      status: 'Live',
      peopleCount: 2,
      avgWait: '1m 20s',
      isLive: true,
      isCongested: false,
      imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 4,
      name: 'Counter 4',
      status: 'Closed',
      peopleCount: 0,
      avgWait: 'Closed',
      isLive: false,
      isCongested: false,
      imageUrl: 'https://images.unsplash.com/photo-1580913428023-02c695666d61?w=800&auto=format&fit=crop&q=80'
    }
  ],

  getLiveStatus() {
    const activeCounters = this.counterState.filter(c => c.isLive);
    const totalQueue = activeCounters.reduce((s, c) => s + c.peopleCount, 0);

    return {
      totalQueueLength: totalQueue || 13,
      queueChange: 4,
      avgWaitingMinutes: '4m 20s',
      waitingChange: '+1m 10s',
      avgServiceMinutes: '2m 05s',
      serviceChange: '-20s',
      activeCountersRatio: `${activeCounters.length} / 4`,
      closedCount: 4 - activeCounters.length,
      counters: this.counterState
    };
  },

  getPredictions(minutes = 10) {
    const mult = minutes === 20 ? 1.4 : minutes === 30 ? 1.8 : 1.0;
    const targetPredicted = Math.round(15 * mult);

    const points = [
      { time: 'Now', current: 8, predicted: 8 },
      { time: '+2 min', current: 9, predicted: 9 },
      { time: '+4 min', current: 10, predicted: 11 },
      { time: `+${Math.round(minutes * 0.6)} min`, current: null, predicted: Math.round(12 * mult) },
      { time: `+${Math.round(minutes * 0.8)} min`, current: null, predicted: Math.round(13 * mult) },
      { time: `+${minutes} min`, current: null, predicted: targetPredicted },
    ];

    return {
      horizonMinutes: minutes,
      targetPredicted,
      dataPoints: points,
      alert: {
        title: 'High congestion likely',
        message: `Queue at Counter 2 is expected to reach ${targetPredicted} people in ${minutes} minutes.`
      },
      recommendation: {
        title: 'Recommendation',
        message: 'Open Counter 4 to avoid congestion and reduce waiting time.'
      }
    };
  },

  getInsights() {
    return {
      peakQueueToday: { count: 14, time: 'at 6:30 PM' },
      totalServedToday: { count: 1248, changePct: 8 },
      longestWaitTime: { duration: '8m 20s', time: 'at 6:15 PM' },
      predictions: [
        {
          title: 'Customer Inflow',
          badge: 'High',
          badgeColor: 'bg-red-50 text-red-700',
          description: 'Expected 28% more customers in next 30 min based on current trend.'
        },
        {
          title: 'Queue Risk',
          badge: 'High',
          badgeColor: 'bg-red-50 text-red-700',
          description: 'Counter 2 likely to reach 15 people in 10 min.'
        },
        {
          title: 'Waiting Time',
          badge: 'Will increase',
          badgeColor: 'bg-amber-50 text-amber-700',
          description: 'Average waiting time may rise to 6m 30s in next 30 min.'
        }
      ]
    };
  },

  toggleCounter(counterId = 4) {
    const counter = this.counterState.find(c => c.id === counterId);
    if (counter) {
      counter.isLive = !counter.isLive;
      counter.status = counter.isLive ? 'Live' : 'Closed';
      if (counter.isLive) {
        counter.peopleCount = 1;
        counter.avgWait = '1m 00s';
      } else {
        counter.peopleCount = 0;
        counter.avgWait = 'Closed';
      }
    }
    return counter;
  }
};
