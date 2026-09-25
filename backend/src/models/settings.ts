import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
  storeId: string;
  storeInfo: {
    name: string;
    code: string;
    address: string;
    region: string;
    timezone: string;
    operatingHours: string;
    contactNumber: string;
    email: string;
  };
  preferences: {
    language: string;
    timeFormat: string;
    dateFormat: string;
    theme: string;
    autoRefresh: string;
    playAlertSound: boolean;
    showAiSuggestions: boolean;
  };
  branding: {
    logoUrl: string;
    brandColor: string;
    secondaryColors: string[];
  };
  subscription: {
    plan: string;
    stores: string;
    camerasPerStore: string;
    validUntil: string;
    features: string[];
  };
  aiDetection: {
    enablePeopleCounting: boolean;
    enableQueueDetection: boolean;
    enableProductRecognition: boolean;
    enablePlanogramCompliance: boolean;
    enableLowStockDetection: boolean;
    detectionSensitivity: number;
    confidenceThreshold: number;
  };
  alertPreferences: {
    queueCongestionAlerts: boolean;
    lowStockAlerts: boolean;
    planogramViolationAlerts: boolean;
    cameraOfflineAlerts: boolean;
    unusualCrowdDensityAlerts: boolean;
    channels: {
      inApp: boolean;
      email: boolean;
      sms: boolean;
      whatsapp: boolean;
    };
  };
  dataBackup: {
    autoBackup: boolean;
    backupFrequency: string;
    retentionPeriod: string;
    lastBackupDate?: Date;
  };
  integrations: {
    email: { name: string; status: 'Connected' | 'Not Connected' | 'Error'; host?: string; port?: number; user?: string; from?: string };
    sms: { name: string; status: 'Connected' | 'Not Connected' | 'Error'; provider?: string; senderId?: string };
    whatsapp: { name: string; status: 'Connected' | 'Not Connected' | 'Error'; provider?: string; phoneNumber?: string };
    slack: { name: string; status: 'Connected' | 'Not Connected' | 'Error'; webhookUrl?: string };
    teams: { name: string; status: 'Connected' | 'Not Connected' | 'Error'; webhookUrl?: string };
  };
  auditLogs: Array<{
    id: string;
    timestamp: Date;
    user: string;
    action: string;
    setting: string;
    oldValue: any;
    newValue: any;
  }>;
}

const SettingSchema = new Schema<ISetting>({
  storeId: { type: String, required: true, unique: true, index: true, default: 'STORE001' },
  storeInfo: {
    name: { type: String, default: 'Chennai – Anna Nagar' },
    code: { type: String, default: 'ST001' },
    address: { type: String, default: 'No. 123, 2nd Main Road, Anna Nagar, Chennai – 600040' },
    region: { type: String, default: 'Tamil Nadu' },
    timezone: { type: String, default: '(UTC+05:30) India Standard Time' },
    operatingHours: { type: String, default: '06:00 AM – 11:59 PM' },
    contactNumber: { type: String, default: '+91 98765 43210' },
    email: { type: String, default: 'annanagar@retailmind.ai' }
  },
  preferences: {
    language: { type: String, default: 'English' },
    timeFormat: { type: String, default: '12 Hour (AM/PM)' },
    dateFormat: { type: String, default: 'DD MMM YYYY' },
    theme: { type: String, default: 'Light' },
    autoRefresh: { type: String, default: '10 seconds' },
    playAlertSound: { type: Boolean, default: true },
    showAiSuggestions: { type: Boolean, default: true }
  },
  branding: {
    logoUrl: { type: String, default: '/logo.png' },
    brandColor: { type: String, default: '#16A34A' },
    secondaryColors: [{ type: String }]
  },
  subscription: {
    plan: { type: String, default: 'Pro' },
    stores: { type: String, default: '12 / 20' },
    camerasPerStore: { type: String, default: '8 / 10' },
    validUntil: { type: String, default: '31 Dec 2026' },
    features: [{ type: String }]
  },
  aiDetection: {
    enablePeopleCounting: { type: Boolean, default: true },
    enableQueueDetection: { type: Boolean, default: true },
    enableProductRecognition: { type: Boolean, default: true },
    enablePlanogramCompliance: { type: Boolean, default: true },
    enableLowStockDetection: { type: Boolean, default: true },
    detectionSensitivity: { type: Number, default: 70 },
    confidenceThreshold: { type: Number, default: 85 }
  },
  alertPreferences: {
    queueCongestionAlerts: { type: Boolean, default: true },
    lowStockAlerts: { type: Boolean, default: true },
    planogramViolationAlerts: { type: Boolean, default: true },
    cameraOfflineAlerts: { type: Boolean, default: true },
    unusualCrowdDensityAlerts: { type: Boolean, default: true },
    channels: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: true }
    }
  },
  dataBackup: {
    autoBackup: { type: Boolean, default: true },
    backupFrequency: { type: String, default: 'Daily' },
    retentionPeriod: { type: String, default: '6 Months' },
    lastBackupDate: { type: Date }
  },
  integrations: {
    email: {
      name: { type: String, default: 'Email (SMTP)' },
      status: { type: String, default: 'Connected' },
      host: { type: String, default: 'smtp.gmail.com' },
      port: { type: Number, default: 587 },
      user: { type: String, default: 'admin@retailmind.ai' },
      from: { type: String, default: 'alerts@retailmind.ai' }
    },
    sms: {
      name: { type: String, default: 'SMS Gateway' },
      status: { type: String, default: 'Connected' },
      provider: { type: String, default: 'Twilio SMS' },
      senderId: { type: String, default: 'RETAILMIND' }
    },
    whatsapp: {
      name: { type: String, default: 'WhatsApp (Twilio)' },
      status: { type: String, default: 'Connected' },
      provider: { type: String, default: 'Twilio WhatsApp' },
      phoneNumber: { type: String, default: '+14155238886' }
    },
    slack: {
      name: { type: String, default: 'Slack' },
      status: { type: String, default: 'Not Connected' },
      webhookUrl: { type: String, default: '' }
    },
    teams: {
      name: { type: String, default: 'Microsoft Teams' },
      status: { type: String, default: 'Not Connected' },
      webhookUrl: { type: String, default: '' }
    }
  },
  auditLogs: [{
    id: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    user: { type: String, default: 'Store Admin' },
    action: { type: String, required: true },
    setting: { type: String, required: true },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed }
  }]
}, { timestamps: true });

export const Setting = mongoose.model<ISetting>('Setting', SettingSchema);
