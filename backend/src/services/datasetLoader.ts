import path from 'path';
import fs from 'fs';
import xlsx from 'xlsx';
import { inMemoryStore, CameraService, NotificationService, TimelineService, isDbConnected } from './dataStore.js';
import { Camera, Notification, TimelineEvent, QueueMetric, Inventory, Store } from '../models/index.js';

const DATASET_PATH = path.resolve(process.cwd(), '..', 'RetailMind_1Year_Synthetic_Dataset.xlsx');
const LOCAL_DATASET_PATH = path.resolve(process.cwd(), 'RetailMind_1Year_Synthetic_Dataset.xlsx');

const CAMERA_IMAGE_MAP: Record<string, { image: string; snapshots: { url: string; stateLabel: string }[] }> = {
  'CAM01': {
    image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80',
    snapshots: [
      { url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80', stateLabel: 'Normal traffic (12 people)' },
      { url: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&auto=format&fit=crop&q=80', stateLabel: 'Peak traffic (18 people)' }
    ]
  },
  'CAM02': {
    image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&auto=format&fit=crop&q=80',
    snapshots: [
      { url: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&auto=format&fit=crop&q=80', stateLabel: 'Grocery aisle shoppers' }
    ]
  },
  'CAM03': {
    image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&auto=format&fit=crop&q=80',
    snapshots: [
      { url: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&auto=format&fit=crop&q=80', stateLabel: 'Low stock: 3/10 (Misplaced Item)' },
      { url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80', stateLabel: 'Restocked: 8/10' }
    ]
  },
  'CAM04': {
    image: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=800&auto=format&fit=crop&q=80',
    snapshots: [
      { url: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=800&auto=format&fit=crop&q=80', stateLabel: 'Beverages stock: 4/12 (Missing product)' }
    ]
  },
  'CAM05': {
    image: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=800&auto=format&fit=crop&q=80',
    snapshots: [
      { url: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=800&auto=format&fit=crop&q=80', stateLabel: 'Shelf C1 Pantry' }
    ]
  },
  'CAM06': {
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
    snapshots: [
      { url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80', stateLabel: 'Produce section: 6 people' }
    ]
  },
  'CAM07': {
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80',
    snapshots: [
      { url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80', stateLabel: 'Cosmetics aisle: 3 people' }
    ]
  },
  'CAM08': {
    image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80',
    snapshots: [
      { url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80', stateLabel: 'Electronics display: 2 people' }
    ]
  },
  'CAM09': {
    image: 'https://images.unsplash.com/photo-1554415707-9e4966668834?w=800&auto=format&fit=crop&q=80',
    snapshots: [
      { url: 'https://images.unsplash.com/photo-1554415707-9e4966668834?w=800&auto=format&fit=crop&q=80', stateLabel: 'Checkout Counter 1: 3 people' }
    ]
  },
  'CAM10': {
    image: 'https://images.unsplash.com/photo-1579113800032-c38bd7635818?w=800&auto=format&fit=crop&q=80',
    snapshots: [
      { url: 'https://images.unsplash.com/photo-1579113800032-c38bd7635818?w=800&auto=format&fit=crop&q=80', stateLabel: 'Counter 2: 8 people (High Queue)' },
      { url: 'https://images.unsplash.com/photo-1554415707-9e4966668834?w=800&auto=format&fit=crop&q=80', stateLabel: 'Counter 2: Relieved (4 people)' }
    ]
  },
  'CAM11': {
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&auto=format&fit=crop&q=80',
    snapshots: [
      { url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&auto=format&fit=crop&q=80', stateLabel: 'Counter 3: 2 people' }
    ]
  },
  'CAM12': {
    image: 'https://images.unsplash.com/photo-1580913428023-02c695666d61?w=800&auto=format&fit=crop&q=80',
    snapshots: [
      { url: 'https://images.unsplash.com/photo-1580913428023-02c695666d61?w=800&auto=format&fit=crop&q=80', stateLabel: 'Counter 4: 1 person' }
    ]
  }
};

export async function loadDatasetAndSeed(): Promise<{ success: boolean; summary: any }> {
  let filepath = '';
  if (fs.existsSync(LOCAL_DATASET_PATH)) {
    filepath = LOCAL_DATASET_PATH;
  } else if (fs.existsSync(DATASET_PATH)) {
    filepath = DATASET_PATH;
  } else {
    throw new Error(`Dataset not found at ${LOCAL_DATASET_PATH} or ${DATASET_PATH}`);
  }

  console.log(`[SEED] Reading Excel dataset from ${filepath}...`);
  const workbook = xlsx.readFile(filepath, { cellDates: true });

  // 1. STORES
  const storeData = {
    storeId: 'STORE001',
    name: 'Chennai – Anna Nagar',
    status: 'Online',
    edgeDevice: 'EDGE-01',
    lastSeen: new Date()
  };
  inMemoryStore.stores = [storeData];
  if (isDbConnected()) {
    try {
      await Store.findOneAndUpdate({ storeId: storeData.storeId }, storeData, { upsert: true });
    } catch (e) {}
  }

  // 2. CAMERA REGISTRY
  const camSheet = workbook.Sheets['Camera_Registry'];
  const camRows: any[] = xlsx.utils.sheet_to_json(camSheet);

  const camerasList: any[] = [];
  for (const row of camRows) {
    const cid = String(row.camera_id || '').toUpperCase();
    const loc = String(row.location || '');
    const cType = String(row.camera_type || '');

    // Standardize category: ENTRANCE, SHELF, CHECKOUT, FLOOR
    let standardizedType: 'ENTRANCE' | 'SHELF' | 'CHECKOUT' | 'FLOOR' = 'FLOOR';
    if (cid === 'CAM01' || loc.toLowerCase().includes('entrance')) {
      standardizedType = 'ENTRANCE';
    } else if (cType.toLowerCase() === 'shelf') {
      standardizedType = 'SHELF';
    } else if (cType.toLowerCase() === 'queue' || loc.toLowerCase().includes('billing')) {
      standardizedType = 'CHECKOUT';
    } else {
      standardizedType = 'FLOOR';
    }

    const imgConfig = CAMERA_IMAGE_MAP[cid] || {
      image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80',
      snapshots: []
    };

    // Initial realistic detected values matching the UI reference
    let peopleCount = 0;
    let queueLength = 0;
    let currentStock = 0;
    let expectedStock = 0;
    let stockStatus: 'Healthy' | 'Low Stock' | 'Out of Stock' | 'N/A' = 'Healthy';
    let density: 'Normal' | 'Moderate' | 'High' | 'N/A' = 'Normal';
    let planogramCompliancePct = 98.0;
    let misplacedItemsCount = 0;
    let shelfHealthScore = 95;

    if (cid === 'CAM01') {
      peopleCount = 12;
      density = 'Normal';
      stockStatus = 'N/A';
    } else if (cid === 'CAM02') {
      peopleCount = 4;
      density = 'Normal';
      stockStatus = 'N/A';
    } else if (cid === 'CAM03') { // Shelf A3 (Milk)
      stockStatus = 'Low Stock';
      currentStock = 3;
      expectedStock = 10;
      planogramCompliancePct = 78.5;
      misplacedItemsCount = 1;
      shelfHealthScore = 38;
      density = 'N/A';
    } else if (cid === 'CAM04') { // Shelf B2 (Soda)
      stockStatus = 'Low Stock';
      currentStock = 4;
      expectedStock = 12;
      planogramCompliancePct = 85.0;
      misplacedItemsCount = 1;
      shelfHealthScore = 62;
      density = 'N/A';
    } else if (cid === 'CAM05') { // Shelf C1
      stockStatus = 'Healthy';
      currentStock = 14;
      expectedStock = 15;
      planogramCompliancePct = 99.0;
      shelfHealthScore = 96;
      density = 'N/A';
    } else if (cid === 'CAM06') { // Fruits & Veg
      peopleCount = 6;
      density = 'Moderate';
      stockStatus = 'N/A';
    } else if (cid === 'CAM09') { // Counter 1
      queueLength = 3;
      stockStatus = 'N/A';
      density = 'N/A';
    } else if (cid === 'CAM10') { // Counter 2
      queueLength = 8;
      stockStatus = 'N/A';
      density = 'N/A';
    } else if (cid === 'CAM11') { // Counter 3
      queueLength = 2;
      stockStatus = 'N/A';
    } else if (cid === 'CAM12') { // Counter 4
      queueLength = 1;
      stockStatus = 'N/A';
    } else {
      peopleCount = 3;
      density = 'Normal';
      stockStatus = 'N/A';
    }

    const camDoc = {
      cameraId: cid,
      storeId: 'STORE001',
      name: row.camera_name || `Camera ${cid}`,
      type: standardizedType,
      location: loc,
      zone: row.location || '',
      resolution: row.resolution || '1080p',
      status: 'ONLINE',
      imageUrl: imgConfig.image,
      snapshots: imgConfig.snapshots.map(s => ({
        url: s.url,
        stateLabel: s.stateLabel,
        timestamp: new Date()
      })),
      aiModules: String(row.ai_modules || '').split(',').map((m: string) => m.trim()),
      peopleCount,
      queueLength,
      currentStock,
      expectedStock,
      stockStatus,
      density,
      planogramCompliancePct,
      misplacedItemsCount,
      shelfHealthScore,
      activeAlerts: cid === 'CAM03' ? ['Low stock: 3/10', 'Misplaced item detected'] : (cid === 'CAM10' ? ['Queue congestion: 8 people'] : []),
      lastUpdated: new Date()
    };

    camerasList.push(camDoc);
    if (isDbConnected()) {
      try {
        await Camera.findOneAndUpdate({ cameraId: cid }, camDoc, { upsert: true });
      } catch (e) {}
    }
  }
  inMemoryStore.cameras = camerasList;

  // 3. NOTIFICATIONS
  const notifSheet = workbook.Sheets['Notifications'];
  const notifRows: any[] = xlsx.utils.sheet_to_json(notifSheet);
  const notifList: any[] = [];

  for (const r of notifRows.slice(0, 100)) { // seed recent 100 notifications
    const n = {
      notificationId: r.notification_id || `NTF${Math.floor(Math.random()*100000)}`,
      storeId: r.store_id || 'STORE001',
      cameraId: r.location === 'SHELF-A3' ? 'CAM03' : (r.location === 'SHELF-A4' ? 'CAM04' : (r.category === 'Queue' ? 'CAM10' : 'CAM01')),
      severity: r.severity || 'Info',
      category: r.category || 'System',
      title: r.subject || r.event || 'System Alert',
      message: r.subject || r.event || '',
      subject: r.subject || '',
      location: r.location || 'Main Floor',
      recipient: r.recipient || 'Store Manager',
      status: r.status || 'Sent',
      generatedAt: r.timestamp ? new Date(r.timestamp) : new Date(),
      sentAt: r.sent ? new Date() : undefined,
      acknowledgedAt: r.acknowledged ? new Date() : undefined,
      resolvedAt: r.resolved ? new Date() : undefined
    };
    notifList.push(n);
    if (isDbConnected()) {
      try {
        await Notification.findOneAndUpdate({ notificationId: n.notificationId }, n, { upsert: true });
      } catch (e) {}
    }
  }
  inMemoryStore.notifications = notifList;

  // 4. TIMELINE EVENTS matching reference screenshot
  const initialTimelineEvents = [
    {
      timestamp: new Date(Date.now() - 40 * 1000),
      cameraId: 'CAM03',
      eventType: 'MISPLACED_ITEM',
      severity: 'Critical',
      title: 'Misplaced item detected',
      description: 'Misplaced product detected on Cam 03 – Shelf A3 (Milk)',
      status: 'active',
      thumbnailUrl: CAMERA_IMAGE_MAP['CAM03'].image
    },
    {
      timestamp: new Date(Date.now() - 75 * 1000),
      cameraId: 'CAM10',
      eventType: 'QUEUE_CONGESTION',
      severity: 'Critical',
      title: 'Queue length increased (8)',
      description: 'Cam 10 – Checkout 2 reached 8 customers; congestion alert',
      status: 'active',
      thumbnailUrl: CAMERA_IMAGE_MAP['CAM10'].image
    },
    {
      timestamp: new Date(Date.now() - 170 * 1000),
      cameraId: 'CAM03',
      eventType: 'LOW_STOCK',
      severity: 'Warning',
      title: 'Low stock detected (Milk)',
      description: 'Cam 03 – Shelf A3 stock reached 3 / 10',
      status: 'active',
      thumbnailUrl: CAMERA_IMAGE_MAP['CAM03'].image
    },
    {
      timestamp: new Date(Date.now() - 295 * 1000),
      cameraId: 'CAM03',
      eventType: 'STAFF_NOTIFIED',
      severity: 'Success',
      title: 'Staff notified',
      description: 'Refill Shelf A3 task dispatched to Store Associate',
      status: 'acknowledged',
      thumbnailUrl: CAMERA_IMAGE_MAP['CAM03'].image
    },
    {
      timestamp: new Date(Date.now() - 410 * 1000),
      cameraId: 'CAM06',
      eventType: 'HIGH_CUSTOMER_DENSITY',
      severity: 'Warning',
      title: 'Customer density high',
      description: 'Cam 06 – Fruits & Veg cluster detected (6 shoppers)',
      status: 'resolved',
      thumbnailUrl: CAMERA_IMAGE_MAP['CAM06'].image
    }
  ];

  for (const item of initialTimelineEvents) {
    TimelineService.createEvent(item);
  }

  // 5. SHOPPER_DAILY_ZONE — load last 365 days of zone data
  try {
    const shopperSheet = workbook.Sheets['Shopper_Daily_Zone'];
    if (shopperSheet) {
      const shopperRows: any[] = xlsx.utils.sheet_to_json(shopperSheet, { cellDates: true } as any);
      inMemoryStore.shopperZoneData = shopperRows.map(r => ({
        date: r.date instanceof Date ? r.date : new Date(r.date),
        store_id: r.store_id || 'STORE001',
        zone: r.zone || 'Unknown',
        visitors: Number(r.visitors) || 0,
        entry_count: Number(r.entry_count) || 0,
        exit_count: Number(r.exit_count) || 0,
        avg_dwell_minutes: parseFloat(r.avg_dwell_minutes) || 0,
        promo_display_dwell_minutes: parseFloat(r.promo_display_dwell_minutes) || 0,
        high_traffic_flag: r.high_traffic_flag === 1 || r.high_traffic_flag === true
      }));
      console.log(`[SEED] Loaded ${inMemoryStore.shopperZoneData.length} shopper zone rows`);
    }
  } catch (e) {
    console.warn('[SEED] Failed to load Shopper_Daily_Zone:', e);
  }

  // 6. DAILY_KPIS — load full KPI history
  try {
    const kpiSheet = workbook.Sheets['Daily_KPIs'];
    if (kpiSheet) {
      const kpiRows: any[] = xlsx.utils.sheet_to_json(kpiSheet, { cellDates: true } as any);
      inMemoryStore.dailyKpiData = kpiRows.map(r => ({
        date: r.date instanceof Date ? r.date : new Date(r.date),
        store_id: r.store_id || 'STORE001',
        footfall: Number(r.footfall) || 0,
        avg_dwell_minutes: parseFloat(r.avg_dwell_minutes) || 0,
        promo_display_dwell_minutes: parseFloat(r.promo_display_dwell_minutes) || 0,
        inventory_availability_pct: parseFloat(r.inventory_availability_pct) || 0,
        low_stock_events: Number(r.low_stock_events) || 0,
        out_of_stock_events: Number(r.out_of_stock_events) || 0,
        planogram_compliance_pct: parseFloat(r.planogram_compliance_pct) || 0,
        avg_queue_length: parseFloat(r.avg_queue_length) || 0,
        peak_queue_length: Number(r.peak_queue_length) || 0,
        avg_wait_minutes: parseFloat(r.avg_wait_minutes) || 0,
        avg_service_minutes: parseFloat(r.avg_service_minutes) || 0,
        congestion_events: Number(r.congestion_events) || 0,
        staff_efficiency_pct: parseFloat(r.staff_efficiency_pct) || 0,
        conversion_indicator_pct: parseFloat(r.conversion_indicator_pct) || 0,
        store_health_score: parseFloat(r.store_health_score) || 0
      }));
      console.log(`[SEED] Loaded ${inMemoryStore.dailyKpiData.length} daily KPI rows`);
    }
  } catch (e) {
    console.warn('[SEED] Failed to load Daily_KPIs:', e);
  }

  const summary = {
    storesCount: inMemoryStore.stores.length,
    camerasCount: inMemoryStore.cameras.length,
    notificationsCount: inMemoryStore.notifications.length,
    timelineEventsCount: inMemoryStore.timelineEvents.length,
    shopperZoneRows: inMemoryStore.shopperZoneData.length,
    dailyKpiRows: inMemoryStore.dailyKpiData.length
  };

  console.log('[SEED] Seeding completed successfully:', summary);
  return { success: true, summary };
}
