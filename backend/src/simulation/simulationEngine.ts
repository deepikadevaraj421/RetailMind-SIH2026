import { inMemoryStore, CameraService, NotificationService, TimelineService } from '../services/dataStore.js';
import { SettingsService } from '../services/settingsService.js';
import { Server } from 'socket.io';
import axios from 'axios';

interface AlertCooldown {
  lastTriggered: number;
  activeStatus: string;
}

export class SimulationEngine {
  private io: Server | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private alertCooldowns: Map<string, AlertCooldown> = new Map();
  private replenishmentTimers: Map<string, NodeJS.Timeout> = new Map();

  // Internal state tracking for demo scenarios
  private shelfA3Cycle: number = 0; // for 6 -> 5 -> 4 -> 3 -> replenish to 8 demo
  private checkout2Queue: number = 8; // for queue congestion demo

  constructor() {}

  public setSocketServer(io: Server) {
    this.io = io;
  }

  public start(intervalMs = 4000) {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[SIMULATION] Engine started with ${intervalMs}ms interval.`);

    this.intervalId = setInterval(() => {
      this.tick();
    }, intervalMs);
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[SIMULATION] Engine stopped.');
  }

  public getStatus() {
    return {
      running: this.isRunning,
      camerasSimulated: inMemoryStore.cameras.length,
      lastTick: new Date()
    };
  }

  private async tick() {
    try {
      const now = new Date();
      const hour = now.getHours();

      // Time-of-day traffic factor
      let trafficMultiplier = 1.0;
      if (hour >= 12 && hour <= 14) trafficMultiplier = 1.3; // lunch peak
      if (hour >= 18 && hour <= 20) trafficMultiplier = 1.4; // evening rush
      if (hour >= 22 || hour <= 6) trafficMultiplier = 0.4;  // night lull

      for (const camera of inMemoryStore.cameras) {
        if (camera.status === 'OFFLINE') continue;

        let changed = false;

        // 1. ENTRANCE & FLOOR CAMERAS
        if (camera.type === 'ENTRANCE' || camera.type === 'FLOOR') {
          // Bounded random walk: delta of -1, 0, or +1
          const deltas = [-1, 0, 1];
          const delta = deltas[Math.floor(Math.random() * deltas.length)];
          const baseCount = camera.type === 'ENTRANCE' ? 12 : 5;
          const target = Math.round(baseCount * trafficMultiplier);
          let newCount = camera.peopleCount + delta;
          if (newCount < 1) newCount = 1;
          if (newCount > target + 6) newCount = target + 4;
          if (newCount < target - 5) newCount = target - 3;

          camera.peopleCount = newCount;
          camera.density = newCount > 15 ? 'High' : (newCount > 8 ? 'Moderate' : 'Normal');
          changed = true;

          // Check HIGH_CUSTOMER_DENSITY alert
          if (camera.density === 'High') {
            await this.handleAlert(camera.cameraId, 'HIGH_CUSTOMER_DENSITY', 'Warning', 'Shopper',
              `High customer density in ${camera.location}`,
              `${camera.name} detected cluster of ${camera.peopleCount} shoppers.`
            );
          }
        }

        // 2. CHECKOUT CAMERAS
        if (camera.type === 'CHECKOUT') {
          if (camera.cameraId === 'CAM10') {
            // Cam 10: checkout scenario (gradual queue rise then relief)
            const arrivals = Math.floor(Math.random() * 3) + 2; // 2..4 arrivals
            const served = Math.floor(Math.random() * 3) + 1;   // 1..3 served
            // Q(t + 1) = Q(t) + arrivals - served
            this.checkout2Queue = Math.max(3, Math.min(16, this.checkout2Queue + (arrivals - served)));
            camera.queueLength = this.checkout2Queue;
            changed = true;

            // Trigger ML queue prediction when queue >= 8
            if (camera.queueLength >= 8) {
              await this.checkQueueCongestionML(camera);
            }
          } else {
            // Other counters: modest random walk 1..5
            const deltas = [-1, 0, 1];
            const delta = deltas[Math.floor(Math.random() * deltas.length)];
            camera.queueLength = Math.max(0, Math.min(6, camera.queueLength + delta));
            changed = true;
          }
        }

        // 3. SHELF CAMERAS
        if (camera.type === 'SHELF') {
          if (camera.cameraId === 'CAM03') {
            // Cam 03: Shelf A3 (Milk) scenario: 5 -> 4 -> 3 -> auto-replenish to 8
            this.shelfA3Cycle = (this.shelfA3Cycle + 1) % 15;

            if (this.shelfA3Cycle === 0) {
              // Reset / depletion start
              camera.currentStock = 5;
              camera.stockStatus = 'Healthy';
              camera.shelfHealthScore = 65;
            } else if (this.shelfA3Cycle === 3) {
              camera.currentStock = 4;
              camera.stockStatus = 'Healthy';
              camera.shelfHealthScore = 52;
            } else if (this.shelfA3Cycle === 6) {
              // Stock drops to 3 / 10 -> LOW_STOCK triggered!
              camera.currentStock = 3;
              camera.stockStatus = 'Low Stock';
              camera.shelfHealthScore = 38;

              await this.handleAlert('CAM03', 'LOW_STOCK', 'Warning', 'Inventory',
                'Low stock detected (Milk)',
                'Cam 03 – Shelf A3 stock reached 3 / 10 (30%). Predicted stock-out: ~18 minutes.'
              );

              // Schedule simulated staff replenishment 15 seconds later
              this.scheduleReplenishment('CAM03', 8);
            }
            changed = true;
          } else if (camera.cameraId === 'CAM04') {
            // Cam 04: Shelf B2 (Soda)
            if (camera.currentStock === 0) camera.stockStatus = 'Out of Stock';
            else if (camera.currentStock <= 4) camera.stockStatus = 'Low Stock';
            else camera.stockStatus = 'Healthy';
            changed = true;
          }
        }

        if (changed) {
          camera.lastUpdated = new Date();
          if (this.io) {
            this.io.emit('camera:update', camera);
          }
        }
      }

      // Emit system status
      if (this.io) {
        this.io.emit('system:status', {
          timestamp: new Date(),
          edgeAiOnline: true,
          unreadNotifications: inMemoryStore.notifications.filter(n => n.status === 'Sent' || n.status === 'Generated').length
        });
      }
    } catch (err: any) {
      console.error('[SIMULATION] Error during tick:', err.message);
    }
  }

  // Real ML queue prediction call
  private async checkQueueCongestionML(camera: any) {
    try {
      const settings = await SettingsService.getSettings();
      if (!settings?.aiDetection?.enableQueueDetection) {
        return; // Queue detection disabled by user setting
      }
      const sensitivity = settings?.aiDetection?.detectionSensitivity ?? 70;
      const confidence = settings?.aiDetection?.confidenceThreshold ?? 85;
      const highThresh = Math.max(5, Math.round(14 - (sensitivity / 10)));
      const critThresh = Math.max(8, highThresh + 4);

      const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
      const payload = {
        queue_length: camera.queueLength,
        arrivals_10min: 6,
        served_10min: 3,
        active_counters: 2,
        footfall_index: 0.75,
        hour: new Date().getHours(),
        minute: new Date().getMinutes(),
        high_threshold: highThresh,
        critical_threshold: critThresh,
        confidence_threshold: confidence / 100
      };

      const response = await axios.post(`${mlUrl}/predict/queue`, payload, { timeout: 2000 });
      const mlData = response.data;

      if (mlData && (mlData.congestionLevel === 'HIGH' || mlData.congestionLevel === 'CRITICAL')) {
        const title = `Queue congestion predicted at ${camera.name}`;
        const message = `${mlData.explanation} Recommendation: ${mlData.recommendation}`;
        const severity = mlData.congestionLevel === 'CRITICAL' ? 'Critical' : 'Warning';

        await this.handleAlert(camera.cameraId, 'QUEUE_CONGESTION', severity, 'Queue', title, message);

        if (this.io) {
          this.io.emit('prediction:update', {
            cameraId: camera.cameraId,
            prediction: mlData,
            timestamp: new Date()
          });
        }
      }
    } catch (e: any) {
      // If ML service is offline, fallback rule engine
      if (camera.queueLength >= 10) {
        await this.handleAlert(camera.cameraId, 'QUEUE_CONGESTION', 'Warning', 'Queue',
          `Queue length increased (${camera.queueLength})`,
          `Queue reached ${camera.queueLength} customers at ${camera.name}. Open additional counter.`
        );
      }
    }
  }

  // Alert generator with deduplication & cooldown
  private async handleAlert(cameraId: string, alertType: string, severity: 'Critical' | 'Warning' | 'Info' | 'Success', category: 'Queue' | 'Inventory' | 'Shopper' | 'Camera' | 'System', title: string, message: string) {
    // Check Settings preferences first
    try {
      const settings = await SettingsService.getSettings();
      const prefs = settings?.alertPreferences;
      if (prefs) {
        if (alertType === 'QUEUE_CONGESTION' && !prefs.queueCongestionAlerts) {
          return; // Suppressed by user setting
        }
        if (alertType === 'LOW_STOCK' && !prefs.lowStockAlerts) {
          return; // Suppressed by user setting
        }
        if ((alertType === 'PLANOGRAM_VIOLATION' || alertType === 'MISPLACED_ITEM') && !prefs.planogramViolationAlerts) {
          return; // Suppressed by user setting
        }
        if (alertType === 'CAMERA_OFFLINE' && !prefs.cameraOfflineAlerts) {
          return; // Suppressed by user setting
        }
        if (alertType === 'HIGH_CUSTOMER_DENSITY' && !prefs.unusualCrowdDensityAlerts) {
          return; // Suppressed by user setting
        }
      }
    } catch (e) {}

    const key = `${cameraId}_${alertType}`;
    const now = Date.now();
    const cooldownPeriod = 45 * 1000; // 45 seconds cooldown between repeat alerts of same type

    const existing = this.alertCooldowns.get(key);
    if (existing && (now - existing.lastTriggered < cooldownPeriod) && existing.activeStatus === 'active') {
      return; // Deduplicated!
    }

    this.alertCooldowns.set(key, { lastTriggered: now, activeStatus: 'active' });

    // 1. Create Notification
    const notif = await NotificationService.create({
      notificationId: `NTF${Date.now()}`,
      storeId: 'STORE001',
      cameraId,
      severity,
      category,
      title,
      message,
      status: 'Sent'
    });

    // 2. Create Timeline Event
    const timelineEvt = await TimelineService.createEvent({
      timestamp: new Date(),
      cameraId,
      eventType: alertType,
      severity,
      title,
      description: message,
      status: 'active'
    });

    // 3. Emit via Socket.IO
    if (this.io) {
      this.io.emit('notification:new', notif);
      this.io.emit('timeline:update', timelineEvt);
      this.io.emit('camera:event', {
        cameraId,
        eventType: alertType,
        severity,
        title,
        timestamp: new Date()
      });
    }

    console.log(`[ALERT ENGINE] Triggered ${alertType} on ${cameraId}: ${title}`);
  }

  // Simulated staff replenishment response
  private scheduleReplenishment(cameraId: string, replenishedStock: number) {
    if (this.replenishmentTimers.has(cameraId)) return;

    const timer = setTimeout(async () => {
      this.replenishmentTimers.delete(cameraId);
      const cam = inMemoryStore.cameras.find(c => c.cameraId === cameraId);
      if (cam) {
        cam.currentStock = replenishedStock;
        cam.stockStatus = 'Healthy';
        cam.shelfHealthScore = 88;
        cam.lastUpdated = new Date();

        // Add timeline event: Staff notified / Replenishment completed
        const replenishEvt = await TimelineService.createEvent({
          timestamp: new Date(),
          cameraId,
          eventType: 'STOCK_RESTORED',
          severity: 'Success',
          title: 'Stock replenished to 8/10',
          description: `Associate restocked ${cam.name}. Low stock alert resolved.`,
          status: 'resolved'
        });

        // Resolve active alerts on this camera
        const unread = inMemoryStore.notifications.filter(n => n.cameraId === cameraId && n.status !== 'Resolved');
        for (const n of unread) {
          await NotificationService.updateStatus(n.notificationId, 'Resolved');
        }

        if (this.io) {
          this.io.emit('camera:update', cam);
          this.io.emit('timeline:update', replenishEvt);
          this.io.emit('notification:updated', { cameraId, status: 'Resolved' });
        }

        const key = `${cameraId}_LOW_STOCK`;
        this.alertCooldowns.delete(key);
        console.log(`[SIMULATION] Replenishment completed for ${cameraId}. Restocked to ${replenishedStock}.`);
      }
    }, 18000); // Replenishes after 18 seconds for demo responsiveness

    this.replenishmentTimers.set(cameraId, timer);
  }

  // Camera Offline / Online simulator
  public async toggleCameraStatus(cameraId: string, status?: 'ONLINE' | 'OFFLINE'): Promise<any> {
    const cam = inMemoryStore.cameras.find(c => c.cameraId === cameraId);
    if (!cam) return null;

    const nextStatus = status || (cam.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE');
    cam.status = nextStatus;
    cam.lastUpdated = new Date();

    if (nextStatus === 'OFFLINE') {
      await this.handleAlert(cameraId, 'CAMERA_OFFLINE', 'Critical', 'Camera',
        `Camera ${cameraId} offline`,
        `${cam.name} at ${cam.location} lost signal to Edge-01 gateway.`
      );
    } else {
      await TimelineService.createEvent({
        timestamp: new Date(),
        cameraId,
        eventType: 'CAMERA_ONLINE',
        severity: 'Success',
        title: `Camera ${cameraId} reconnected`,
        description: `${cam.name} re-established connection.`,
        status: 'resolved'
      });
    }

    if (this.io) {
      this.io.emit('camera:status', { cameraId, status: nextStatus });
      this.io.emit('camera:update', cam);
    }

    return cam;
  }
}

export const simulationEngine = new SimulationEngine();
