import mongoose, { Schema, Document } from 'mongoose';

// 1. STORE
export interface IStore extends Document {
  storeId: string;
  name: string;
  status: string;
  edgeDevice: string;
  lastSeen: Date;
}

const StoreSchema = new Schema<IStore>({
  storeId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  status: { type: String, default: 'Online' },
  edgeDevice: { type: String, default: 'EDGE-01' },
  lastSeen: { type: Date, default: Date.now }
}, { timestamps: true });

// 2. CAMERA
export interface ICameraSnapshot {
  url: string;
  stateLabel: string;
  timestamp: Date;
}

export interface ICamera extends Document {
  cameraId: string;
  storeId: string;
  name: string;
  type: 'ENTRANCE' | 'SHELF' | 'CHECKOUT' | 'FLOOR';
  location: string;
  zone: string;
  resolution: string;
  status: 'ONLINE' | 'OFFLINE';
  imageUrl: string;
  streamUrl?: string;
  snapshots: ICameraSnapshot[];
  aiModules: string[];
  peopleCount: number;
  queueLength: number;
  currentStock: number;
  expectedStock: number;
  stockStatus: 'Healthy' | 'Low Stock' | 'Out of Stock' | 'N/A';
  density: 'Normal' | 'Moderate' | 'High' | 'N/A';
  planogramCompliancePct: number;
  misplacedItemsCount: number;
  shelfHealthScore: number;
  activeAlerts: string[];
  lastUpdated: Date;
}

const CameraSchema = new Schema<ICamera>({
  cameraId: { type: String, required: true, unique: true, index: true },
  storeId: { type: String, default: 'STORE001', index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['ENTRANCE', 'SHELF', 'CHECKOUT', 'FLOOR'], required: true, index: true },
  location: { type: String, required: true, index: true },
  zone: { type: String, default: '' },
  resolution: { type: String, default: '1080p' },
  status: { type: String, enum: ['ONLINE', 'OFFLINE'], default: 'ONLINE', index: true },
  imageUrl: { type: String, required: true },
  streamUrl: { type: String, default: '' },
  snapshots: [{
    url: String,
    stateLabel: String,
    timestamp: Date
  }],
  aiModules: [{ type: String }],
  peopleCount: { type: Number, default: 0 },
  queueLength: { type: Number, default: 0 },
  currentStock: { type: Number, default: 0 },
  expectedStock: { type: Number, default: 0 },
  stockStatus: { type: String, enum: ['Healthy', 'Low Stock', 'Out of Stock', 'N/A'], default: 'Healthy' },
  density: { type: String, enum: ['Normal', 'Moderate', 'High', 'N/A'], default: 'Normal' },
  planogramCompliancePct: { type: Number, default: 100 },
  misplacedItemsCount: { type: Number, default: 0 },
  shelfHealthScore: { type: Number, default: 100 },
  activeAlerts: [{ type: String }],
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

// 3. CAMERA EVENT
export interface ICameraEvent extends Document {
  eventId: string;
  timestamp: Date;
  cameraId: string;
  storeId: string;
  eventType: string;
  severity: 'Critical' | 'Warning' | 'Info' | 'Success';
  title: string;
  description: string;
  metadata?: any;
}

const CameraEventSchema = new Schema<ICameraEvent>({
  eventId: { type: String, required: true, unique: true },
  timestamp: { type: Date, required: true, index: true },
  cameraId: { type: String, required: true, index: true },
  storeId: { type: String, default: 'STORE001', index: true },
  eventType: { type: String, required: true, index: true },
  severity: { type: String, enum: ['Critical', 'Warning', 'Info', 'Success'], required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed }
});

// 4. TIMELINE EVENT
export interface ITimelineEvent extends Document {
  timestamp: Date;
  cameraId: string;
  eventType: string;
  severity: 'Critical' | 'Warning' | 'Info' | 'Success';
  title: string;
  description: string;
  status: string;
  thumbnailUrl?: string;
}

const TimelineEventSchema = new Schema<ITimelineEvent>({
  timestamp: { type: Date, required: true, index: true },
  cameraId: { type: String, required: true, index: true },
  eventType: { type: String, required: true },
  severity: { type: String, enum: ['Critical', 'Warning', 'Info', 'Success'], required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, default: 'active' },
  thumbnailUrl: { type: String }
});

// 5. QUEUE METRIC
export interface IQueueMetric extends Document {
  timestamp: Date;
  cameraId: string;
  storeId: string;
  counterId: string;
  queueLength: number;
  arrivals10min: number;
  served10min: number;
  avgWaitMinutes: number;
  avgServiceMinutes: number;
  activeCounters: number;
  next10minQueue: number;
  congestionNext10min: number;
}

const QueueMetricSchema = new Schema<IQueueMetric>({
  timestamp: { type: Date, required: true, index: true },
  cameraId: { type: String, required: true, index: true },
  storeId: { type: String, default: 'STORE001' },
  counterId: { type: String, required: true },
  queueLength: { type: Number, required: true },
  arrivals10min: { type: Number, default: 0 },
  served10min: { type: Number, default: 0 },
  avgWaitMinutes: { type: Number, default: 0 },
  avgServiceMinutes: { type: Number, default: 0 },
  activeCounters: { type: Number, default: 2 },
  next10minQueue: { type: Number, default: 0 },
  congestionNext10min: { type: Number, default: 0 }
});

// 6. INVENTORY
export interface IInventory extends Document {
  date: Date;
  shelfId: string;
  sku: string;
  productName: string;
  zone: string;
  expectedStock: number;
  currentStock: number;
  stockPercentage: number;
  dailyUnitsSoldEst: number;
  replenishmentUnits: number;
  stockStatus: string;
  planogramCompliancePct: number;
  misplacementDetected: number;
  demandLevel: string;
  stockoutRisk: number;
  replenishmentRequired: number;
}

const InventorySchema = new Schema<IInventory>({
  date: { type: Date, required: true, index: true },
  shelfId: { type: String, required: true, index: true },
  sku: { type: String, required: true, index: true },
  productName: { type: String, required: true },
  zone: { type: String, default: '' },
  expectedStock: { type: Number, required: true },
  currentStock: { type: Number, required: true },
  stockPercentage: { type: Number, required: true },
  dailyUnitsSoldEst: { type: Number, default: 0 },
  replenishmentUnits: { type: Number, default: 0 },
  stockStatus: { type: String, default: 'Healthy' },
  planogramCompliancePct: { type: Number, default: 100 },
  misplacementDetected: { type: Number, default: 0 },
  demandLevel: { type: String, default: 'Medium' },
  stockoutRisk: { type: Number, default: 0 },
  replenishmentRequired: { type: Number, default: 0 }
});

// 7. NOTIFICATION
export interface INotification extends Document {
  notificationId: string;
  storeId: string;
  cameraId: string;
  severity: 'Critical' | 'Warning' | 'Info' | 'Success';
  category: 'Queue' | 'Inventory' | 'Shopper' | 'Camera' | 'System';
  title: string;
  message: string;
  subject: string;
  location: string;
  recipient: string;
  status: 'Generated' | 'Sent' | 'Acknowledged' | 'Resolved';
  generatedAt: Date;
  sentAt?: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

const NotificationSchema = new Schema<INotification>({
  notificationId: { type: String, required: true, unique: true, index: true },
  storeId: { type: String, default: 'STORE001' },
  cameraId: { type: String, required: true, index: true },
  severity: { type: String, enum: ['Critical', 'Warning', 'Info', 'Success'], required: true, index: true },
  category: { type: String, enum: ['Queue', 'Inventory', 'Shopper', 'Camera', 'System'], required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  subject: { type: String, default: '' },
  location: { type: String, default: '' },
  recipient: { type: String, default: 'Store Manager' },
  status: { type: String, enum: ['Generated', 'Sent', 'Acknowledged', 'Resolved'], default: 'Sent', index: true },
  generatedAt: { type: Date, default: Date.now, index: true },
  sentAt: { type: Date, default: Date.now },
  acknowledgedAt: { type: Date },
  resolvedAt: { type: Date }
}, { timestamps: true });

// 8. PREDICTION RESULT
export interface IPredictionResult extends Document {
  timestamp: Date;
  cameraId: string;
  predictionType: string;
  modelName: string;
  modelVersion: string;
  inputSummary: any;
  prediction: any;
  explanation: string;
  recommendation: string;
}

const PredictionResultSchema = new Schema<IPredictionResult>({
  timestamp: { type: Date, default: Date.now, index: true },
  cameraId: { type: String, required: true, index: true },
  predictionType: { type: String, required: true, index: true },
  modelName: { type: String, required: true },
  modelVersion: { type: String, required: true },
  inputSummary: { type: Schema.Types.Mixed },
  prediction: { type: Schema.Types.Mixed },
  explanation: { type: String, default: '' },
  recommendation: { type: String, default: '' }
});

export const Store = mongoose.model<IStore>('Store', StoreSchema);
export const Camera = mongoose.model<ICamera>('Camera', CameraSchema);
export const CameraEvent = mongoose.model<ICameraEvent>('CameraEvent', CameraEventSchema);
export const TimelineEvent = mongoose.model<ITimelineEvent>('TimelineEvent', TimelineEventSchema);
export const QueueMetric = mongoose.model<IQueueMetric>('QueueMetric', QueueMetricSchema);
export const Inventory = mongoose.model<IInventory>('Inventory', InventorySchema);
export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
export const PredictionResult = mongoose.model<IPredictionResult>('PredictionResult', PredictionResultSchema);

// 9. USER
export interface IUser extends Document {
  userId: string;
  name: string;
  email: string;
  role: 'Store Admin' | 'Store Manager' | 'Staff' | 'Accountant' | 'Head Office';
  storeId: string;
  status: 'Active' | 'Inactive';
  lastActive: Date;
  permissions: string[];
}

const UserSchema = new Schema<IUser>({
  userId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ['Store Admin', 'Store Manager', 'Staff', 'Accountant', 'Head Office'], default: 'Staff' },
  storeId: { type: String, default: 'STORE001' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  lastActive: { type: Date, default: Date.now },
  permissions: [{ type: String }]
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);

export * from './settings.js';

