export type CameraType = 'ENTRANCE' | 'SHELF' | 'CHECKOUT' | 'FLOOR';
export type CameraStatus = 'ONLINE' | 'OFFLINE';

export interface CameraSnapshot {
  url: string;
  stateLabel: string;
  timestamp: string;
}

export interface Camera {
  cameraId: string;
  storeId: string;
  name: string;
  type: CameraType;
  location: string;
  zone?: string;
  resolution: string;
  status: CameraStatus;
  imageUrl: string;
  streamUrl?: string;
  snapshots?: CameraSnapshot[];
  aiModules?: string[];
  peopleCount: number;
  queueLength: number;
  currentStock: number;
  expectedStock: number;
  stockStatus: 'Healthy' | 'Low Stock' | 'Out of Stock' | 'N/A';
  density: 'Normal' | 'Moderate' | 'High' | 'N/A';
  planogramCompliancePct: number;
  misplacedItemsCount: number;
  shelfHealthScore: number;
  activeAlerts?: string[];
  lastUpdated: string;
}

export interface CameraCounts {
  all: number;
  entrance: number;
  shelves: number;
  checkout: number;
  floor: number;
}

export interface TimelineEventItem {
  _id?: string;
  timestamp: string;
  cameraId: string;
  eventType: string;
  severity: 'Critical' | 'Warning' | 'Info' | 'Success';
  title: string;
  description: string;
  status: string;
  thumbnailUrl?: string;
}

export interface NotificationItem {
  notificationId: string;
  storeId: string;
  cameraId: string;
  severity: 'Critical' | 'Warning' | 'Info' | 'Success';
  category: 'Queue' | 'Inventory' | 'Shopper' | 'Camera' | 'System';
  title: string;
  message: string;
  subject?: string;
  location?: string;
  recipient: string;
  status: 'Generated' | 'Sent' | 'Acknowledged' | 'Resolved';
  generatedAt: string;
  sentAt?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface SystemStatus {
  api: string;
  mongodb: string;
  ml: string;
  simulation: string;
  socket: string;
  timestamp: string;
}
