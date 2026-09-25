import React, { useState, useEffect, useCallback } from 'react';
import {
  Store, Settings as SettingsIcon, Video, Cpu, Bell, Users,
  Cable, Database, ShieldCheck, Check, AlertTriangle, RefreshCw,
  Edit2, Upload, Cloud, Trash2, Send, CheckCircle2, X, ExternalLink,
  ChevronDown, Search, Lock, Activity, Eye, ShieldAlert, Sparkles,
  Sliders, Layers, Terminal, ArrowRight, Download, Server
} from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import {
  fetchSettings, updateSettingsGeneral, updateSettingsPreferences,
  updateSettingsBranding, updateSettingsAi, updateSettingsAlerts,
  updateSettingsBackup, updateSettingsIntegration, testAlert,
  testIntegration, triggerBackup, resetSettingsDefault, resetStoreData,
  fetchStores, fetchUsers, fetchMlModels, fetchCameras
} from '../services/api';
import { getSocket } from '../services/socket';

// ── Types ──────────────────────────────────────────────────────────────────
type TabKey =
  | 'general'
  | 'stores'
  | 'cameras'
  | 'ai'
  | 'alerts'
  | 'users'
  | 'integrations'
  | 'backup';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Aux data
  const [stores, setStores] = useState<any[]>([]);
  const [cameras, setCameras] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [mlModels, setMlModels] = useState<any[]>([]);

  // Modals
  const [editStoreModalOpen, setEditStoreModalOpen] = useState(false);
  const [storeFormData, setStoreFormData] = useState<any>({});
  const [logoModalOpen, setLogoModalOpen] = useState(false);
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [integrationModalKey, setIntegrationModalKey] = useState<string | null>(null);
  const [integrationFormData, setIntegrationFormData] = useState<any>({});
  const [testingIntegration, setTestingIntegration] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [dangerModalOpen, setDangerModalOpen] = useState(false);
  const [testAlertModalOpen, setTestAlertModalOpen] = useState(false);
  const [testAlertChannel, setTestAlertChannel] = useState('WhatsApp');
  const [testAlertResult, setTestAlertResult] = useState<any>(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [lastBackupInfo, setLastBackupInfo] = useState<any>(null);

  // Show Toast
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load Settings
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [settingsRes, storesRes, camerasRes, usersRes, modelsRes] = await Promise.all([
        fetchSettings('STORE001').catch(() => null),
        fetchStores().catch(() => []),
        fetchCameras().then(res => res.data).catch(() => []),
        fetchUsers().catch(() => []),
        fetchMlModels().catch(() => [])
      ]);

      if (settingsRes) {
        setSettings(settingsRes);
        setStoreFormData(settingsRes.storeInfo || {});
      }
      setStores(storesRes || []);
      setCameras(camerasRes || []);
      setUsers(usersRes || []);
      setMlModels(modelsRes || []);
    } catch (e: any) {
      showToast('Failed to load settings data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Socket.io real-time updates
    const socket = getSocket();
    const handleSettingsUpdate = (evt: any) => {
      if (evt.section === 'all' && evt.data) {
        setSettings(evt.data);
      } else if (evt.section && evt.data) {
        setSettings((prev: any) => prev ? { ...prev, [evt.section]: evt.data } : prev);
      }
    };

    socket.on('settings:update', handleSettingsUpdate);
    return () => {
      socket.off('settings:update', handleSettingsUpdate);
    };
  }, [loadData]);

  // ── Handlers for General Settings ──────────────────────────────────────────

  // Store Information Save
  const handleSaveStoreInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await updateSettingsGeneral(storeFormData);
      if (res.success) {
        setSettings(res.data);
        setEditStoreModalOpen(false);
        showToast('Store information updated successfully!');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update store info', 'error');
    } finally {
      setSaving(false);
    }
  };

  // System Preferences Update
  const handlePreferenceChange = async (field: string, value: any) => {
    if (!settings) return;
    const updated = { ...settings.preferences, [field]: value };
    setSettings({ ...settings, preferences: updated });
    try {
      await updateSettingsPreferences(updated);
      showToast(`Preference updated: ${field}`);
    } catch (err) {
      showToast('Failed to persist preference', 'error');
    }
  };

  // Brand Color Update
  const handleBrandColorChange = async (color: string) => {
    if (!settings) return;
    const updated = { ...settings.branding, brandColor: color };
    setSettings({ ...settings, branding: updated });
    try {
      await updateSettingsBranding(updated);
      showToast('Brand color updated');
    } catch (err) {
      showToast('Failed to save brand color', 'error');
    }
  };

  // AI & Detection Toggle
  const handleAiToggle = async (field: string, value: boolean) => {
    if (!settings) return;
    const updated = { ...settings.aiDetection, [field]: value };
    setSettings({ ...settings, aiDetection: updated });
    try {
      await updateSettingsAi(updated);
      showToast(`AI setting changed: ${field}`);
    } catch (err) {
      showToast('Failed to save AI setting', 'error');
    }
  };

  // AI Slider change
  const handleAiSliderChange = async (field: string, value: number) => {
    if (!settings) return;
    const updated = { ...settings.aiDetection, [field]: value };
    setSettings({ ...settings, aiDetection: updated });
    try {
      await updateSettingsAi(updated);
    } catch (err) {
      showToast('Failed to update threshold', 'error');
    }
  };

  // Alert Preferences Toggle
  const handleAlertToggle = async (field: string, value: boolean) => {
    if (!settings) return;
    const updated = { ...settings.alertPreferences, [field]: value };
    setSettings({ ...settings, alertPreferences: updated });
    try {
      await updateSettingsAlerts(updated);
      showToast(`Alert preference changed: ${field}`);
    } catch (err) {
      showToast('Failed to save alert preference', 'error');
    }
  };

  // Alert Channel Toggle
  const handleChannelToggle = async (channelKey: string) => {
    if (!settings) return;
    const currentChannels = settings.alertPreferences?.channels || {};
    const updatedChannels = { ...currentChannels, [channelKey]: !currentChannels[channelKey] };
    const updated = { ...settings.alertPreferences, channels: updatedChannels };
    setSettings({ ...settings, alertPreferences: updated });
    try {
      await updateSettingsAlerts(updated);
      showToast(`Notification channel updated`);
    } catch (err) {
      showToast('Failed to update channels', 'error');
    }
  };

  // Backup Settings Update
  const handleBackupChange = async (field: string, value: any) => {
    if (!settings) return;
    const updated = { ...settings.dataBackup, [field]: value };
    setSettings({ ...settings, dataBackup: updated });
    try {
      await updateSettingsBackup(updated);
      showToast('Backup configuration updated');
    } catch (err) {
      showToast('Failed to update backup settings', 'error');
    }
  };

  // Trigger Backup Now
  const handleBackupNow = async () => {
    try {
      setBackupLoading(true);
      const res = await triggerBackup();
      if (res.success) {
        setLastBackupInfo(res);
        showToast(`Backup created successfully (${res.sizeFormatted})!`);
      }
    } catch (err: any) {
      showToast('Backup failed: ' + err.message, 'error');
    } finally {
      setBackupLoading(false);
    }
  };

  // Test Alert Trigger
  const handleSendTestAlert = async () => {
    try {
      setSaving(true);
      const res = await testAlert(testAlertChannel, 'Store Manager');
      setTestAlertResult(res);
      showToast(res.message || 'Test alert dispatched!');
    } catch (err: any) {
      showToast('Test alert failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Reset to Defaults
  const handleResetDefaults = async () => {
    if (!confirm('Are you sure you want to reset all settings to system defaults?')) return;
    try {
      setSaving(true);
      const res = await resetSettingsDefault('STORE001');
      if (res.success) {
        setSettings(res.data);
        showToast('Settings restored to default');
      }
    } catch (err) {
      showToast('Failed to reset defaults', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Danger Zone: Reset Store Data
  const handleConfirmResetStoreData = async () => {
    try {
      setSaving(true);
      const res = await resetStoreData();
      if (res.success) {
        showToast(res.message);
        setDangerModalOpen(false);
        loadData();
      }
    } catch (err) {
      showToast('Failed to reset store data', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Test Integration
  const handleTestIntegration = async (key: string) => {
    try {
      setTestingIntegration(true);
      setTestResult(null);
      const res = await testIntegration(key);
      setTestResult(res);
      if (res.success) {
        showToast(res.message);
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      setTestResult({ success: false, message: 'Connection test failed: ' + err.message });
      showToast('Integration test failed', 'error');
    } finally {
      setTestingIntegration(false);
    }
  };

  // Open configure modal for integration
  const openConfigureIntegration = (key: string) => {
    const config = settings?.integrations?.[key] || {};
    setIntegrationModalKey(key);
    setIntegrationFormData({ ...config });
    setTestResult(null);
  };

  // Save integration modal
  const handleSaveIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!integrationModalKey) return;
    try {
      setSaving(true);
      const res = await updateSettingsIntegration(integrationModalKey, integrationFormData);
      if (res.success) {
        setSettings(res.data);
        setIntegrationModalKey(null);
        showToast(`${integrationFormData.name || integrationModalKey} configuration saved!`);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save integration', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Render Loading Skeleton ────────────────────────────────────────────────
  if (loading && !settings) {
    return (
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAF9] min-h-screen overflow-y-auto">
        <TopBar unreadCount={3} />
        <div className="p-8 space-y-6 animate-pulse">
          <div className="h-10 bg-slate-200 rounded-lg w-64"></div>
          <div className="h-12 bg-slate-200 rounded-lg w-full max-w-4xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-72 bg-white rounded-xl border border-slate-200 shadow-sm p-4"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const storeInfo = settings?.storeInfo || {};
  const preferences = settings?.preferences || {};
  const branding = settings?.branding || {};
  const subscription = settings?.subscription || {};
  const aiDetection = settings?.aiDetection || {};
  const alertPreferences = settings?.alertPreferences || {};
  const dataBackup = settings?.dataBackup || {};
  const integrations = settings?.integrations || {};

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAF9] min-h-screen overflow-y-auto font-sans text-[#0F172A]">

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg border text-sm font-medium flex items-center gap-2 transition-all ${
          toastMessage.type === 'error'
            ? 'bg-red-50 text-red-800 border-red-200'
            : toastMessage.type === 'info'
            ? 'bg-blue-50 text-blue-800 border-blue-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {toastMessage.type === 'error' ? <AlertTriangle className="w-4 h-4 text-red-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Bar */}
      <TopBar
        storeName={storeInfo.name || 'Chennai – Anna Nagar'}
        isOnline={true}
        lastSyncedText="2 min ago"
        unreadCount={3}
      />

      {/* Header Banner Area */}
      <div className="px-7 pt-6 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Settings</h1>
            <p className="text-sm text-slate-500 mt-1">Configure your store, devices, AI models and preferences.</p>
          </div>

          {/* Supermarket Banner Visual on Right */}
          <div className="relative overflow-hidden rounded-xl h-24 w-full lg:w-[480px] shadow-sm border border-slate-200 bg-slate-900 shrink-0">
            <img
              src="https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80"
              alt="Retail Supermarket Grocery Aisle"
              className="w-full h-full object-cover opacity-60 filter brightness-95"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/60 flex items-center justify-end px-6">
              <div className="text-right">
                <div className="text-white/95 font-serif italic text-base leading-tight drop-shadow tracking-wide">
                  Configure
                </div>
                <div className="text-white/95 font-serif italic text-base leading-tight drop-shadow tracking-wide">
                  Control
                </div>
                <div className="text-white/95 font-serif italic text-base leading-tight drop-shadow tracking-wide flex items-center justify-end gap-1">
                  <span>Grow Better</span>
                  <span className="text-emerald-400 not-italic text-sm">🍃</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 text-sm select-none border-b border-slate-200">
          {[
            { key: 'general', label: 'General', icon: Sliders },
            { key: 'stores', label: 'Stores', icon: Store },
            { key: 'cameras', label: 'Cameras & Devices', icon: Video },
            { key: 'ai', label: 'AI & Analytics', icon: Cpu },
            { key: 'alerts', label: 'Alerts & Notifications', icon: Bell },
            { key: 'users', label: 'Users & Access', icon: Users },
            { key: 'integrations', label: 'Integrations', icon: Cable },
            { key: 'backup', label: 'Data & Backup', icon: Database },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabKey)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#16A34A] text-white shadow-sm font-semibold'
                    : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-b-0 border-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-7 pb-10">

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 1: GENERAL (8-CARD GRID MATCHING REFERENCE SCREENSHOT)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

            {/* CARD 1: STORE INFORMATION */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <Store className="w-4 h-4 text-[#16A34A]" />
                    <span>Store Information</span>
                  </div>
                  <button
                    onClick={() => {
                      setStoreFormData(storeInfo);
                      setEditStoreModalOpen(true);
                    }}
                    className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold px-2.5 py-1 rounded transition-colors"
                  >
                    Edit
                  </button>
                </div>

                <div className="mt-3.5 space-y-2.5 text-xs">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-slate-500 font-medium shrink-0">Store Name</span>
                    <span className="text-slate-900 font-semibold text-right">{storeInfo.name}</span>
                  </div>
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-slate-500 font-medium shrink-0">Store Code</span>
                    <span className="text-slate-900 font-medium text-right">{storeInfo.code}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 font-medium shrink-0">Address</span>
                    <span className="text-slate-800 text-right leading-tight max-w-[170px]">{storeInfo.address}</span>
                  </div>
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-slate-500 font-medium shrink-0">Region</span>
                    <span className="text-slate-900 font-medium text-right">{storeInfo.region}</span>
                  </div>
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-slate-500 font-medium shrink-0">Timezone</span>
                    <span className="text-slate-800 text-right text-[11px]">{storeInfo.timezone}</span>
                  </div>
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-slate-500 font-medium shrink-0">Operating Hours</span>
                    <span className="text-slate-900 font-medium text-right">{storeInfo.operatingHours}</span>
                  </div>
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-slate-500 font-medium shrink-0">Contact Number</span>
                    <span className="text-slate-900 font-medium text-right">{storeInfo.contactNumber}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: SYSTEM PREFERENCES */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm pb-3 border-b border-slate-100">
                  <SettingsIcon className="w-4 h-4 text-[#16A34A]" />
                  <span>System Preferences</span>
                </div>

                <div className="mt-3.5 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Language</span>
                    <select
                      value={preferences.language || 'English'}
                      onChange={(e) => handlePreferenceChange('language', e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#16A34A]"
                    >
                      <option value="English">English</option>
                      <option value="Tamil">Tamil (தமிழ்)</option>
                      <option value="Hindi">Hindi (हिंदी)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Time Format</span>
                    <select
                      value={preferences.timeFormat || '12 Hour (AM/PM)'}
                      onChange={(e) => handlePreferenceChange('timeFormat', e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#16A34A]"
                    >
                      <option value="12 Hour (AM/PM)">12 Hour (AM/PM)</option>
                      <option value="24 Hour">24 Hour</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Date Format</span>
                    <select
                      value={preferences.dateFormat || 'DD MMM YYYY'}
                      onChange={(e) => handlePreferenceChange('dateFormat', e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#16A34A]"
                    >
                      <option value="DD MMM YYYY">DD MMM YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Theme</span>
                    <select
                      value={preferences.theme || 'Light'}
                      onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#16A34A]"
                    >
                      <option value="Light">Light</option>
                      <option value="Dark">Dark</option>
                      <option value="System">System</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Auto Refresh (Live Data)</span>
                    <select
                      value={preferences.autoRefresh || '10 seconds'}
                      onChange={(e) => handlePreferenceChange('autoRefresh', e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#16A34A]"
                    >
                      <option value="5 seconds">5 seconds</option>
                      <option value="10 seconds">10 seconds</option>
                      <option value="30 seconds">30 seconds</option>
                      <option value="1 minute">1 minute</option>
                      <option value="Off">Off</option>
                    </select>
                  </div>

                  {/* Play Alert Sound Toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500 font-medium">Play Alert Sound</span>
                    <button
                      type="button"
                      onClick={() => handlePreferenceChange('playAlertSound', !preferences.playAlertSound)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        preferences.playAlertSound ? 'bg-[#16A34A]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          preferences.playAlertSound ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Show AI Suggestions Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Show AI Suggestions</span>
                    <button
                      type="button"
                      onClick={() => handlePreferenceChange('showAiSuggestions', !preferences.showAiSuggestions)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        preferences.showAiSuggestions ? 'bg-[#16A34A]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          preferences.showAiSuggestions ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 3: STORE LOGO & BRANDING */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm pb-3 border-b border-slate-100">
                  <Sliders className="w-4 h-4 text-[#16A34A]" />
                  <span>Store Logo & Branding</span>
                </div>

                {/* Logo Box */}
                <div className="mt-4 border border-slate-200 rounded-lg p-3 bg-slate-50/50 flex flex-col items-center justify-center text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-md bg-[#16A34A] flex items-center justify-center text-white font-bold text-xs">
                      RM
                    </div>
                    <span className="font-extrabold text-slate-900 text-base">RetailMind</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Smarter Stores. Happier People.</p>
                </div>

                {/* Change Logo Button */}
                <div className="mt-3 flex justify-center">
                  <button
                    onClick={() => setLogoModalOpen(true)}
                    className="flex items-center gap-1.5 border border-slate-300 hover:bg-slate-50 px-3 py-1 rounded text-xs font-medium text-slate-700 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Change Logo</span>
                  </button>
                </div>

                {/* Brand Color Selector */}
                <div className="mt-4">
                  <span className="text-xs font-semibold text-slate-700 block mb-2">Brand Color</span>
                  <div className="flex items-center gap-2.5">
                    {[
                      { hex: '#16A34A', label: 'Primary Green' },
                      { hex: '#86EFAC', label: 'Mint Light' },
                      { hex: '#FEF08A', label: 'Warm Pastel' },
                      { hex: '#E0F2FE', label: 'Soft Sky' }
                    ].map(c => {
                      const isSelected = branding.brandColor === c.hex;
                      return (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => handleBrandColorChange(c.hex)}
                          title={c.label}
                          className={`w-6 h-6 rounded-full transition-transform ${
                            isSelected ? 'ring-2 ring-offset-2 ring-[#16A34A] scale-110' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.hex }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 4: SUBSCRIPTION & PLAN */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <Sparkles className="w-4 h-4 text-[#16A34A]" />
                    <span>Subscription &amp; Plan</span>
                  </div>
                  <button
                    onClick={() => showToast('You are on the highest Pro enterprise tier.')}
                    className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold px-2.5 py-1 rounded transition-colors"
                  >
                    Upgrade Plan
                  </button>
                </div>

                <div className="mt-3.5 space-y-2 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500 font-medium">Current Plan</span>
                    <span className="text-slate-900 font-bold">{subscription.plan || 'Pro'}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500 font-medium">Stores</span>
                    <span className="text-slate-800 font-medium">{subscription.stores || '12 / 20'}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500 font-medium">Cameras per Store</span>
                    <span className="text-slate-800 font-medium">{subscription.camerasPerStore || '8 / 10'}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500 font-medium">Valid Till</span>
                    <span className="text-slate-900 font-semibold">{subscription.validUntil || '31 Dec 2026'}</span>
                  </div>
                </div>

                {/* Features Checkmarks */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-700">
                  {(subscription.features || [
                    'AI Analytics',
                    'Multi-Store Support',
                    'Priority Support',
                    'Advanced Reports',
                    'API Access'
                  ]).map((feat: string) => (
                    <div key={feat} className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-[#16A34A]" />
                      </div>
                      <span className="text-[11px] font-medium">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CARD 5: AI & DETECTION SETTINGS */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm pb-3 border-b border-slate-100">
                  <Cpu className="w-4 h-4 text-[#16A34A]" />
                  <span>AI &amp; Detection Settings</span>
                </div>

                <div className="mt-3.5 space-y-2.5 text-xs">
                  {[
                    { key: 'enablePeopleCounting', label: 'Enable People Counting' },
                    { key: 'enableQueueDetection', label: 'Enable Queue Detection' },
                    { key: 'enableProductRecognition', label: 'Enable Product Recognition' },
                    { key: 'enablePlanogramCompliance', label: 'Enable Planogram Compliance' },
                    { key: 'enableLowStockDetection', label: 'Enable Low Stock Detection' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">{item.label}</span>
                      <button
                        type="button"
                        onClick={() => handleAiToggle(item.key, !aiDetection[item.key])}
                        className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          aiDetection[item.key] !== false ? 'bg-[#16A34A]' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            aiDetection[item.key] !== false ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}

                  {/* Detection Sensitivity Slider */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600 font-medium">Detection Sensitivity</span>
                      <span className="font-bold text-slate-900">{aiDetection.detectionSensitivity || 70}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={aiDetection.detectionSensitivity || 70}
                      onChange={(e) => handleAiSliderChange('detectionSensitivity', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#16A34A]"
                    />
                  </div>

                  {/* Confidence Threshold Slider */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600 font-medium">Confidence Threshold</span>
                      <span className="font-bold text-slate-900">{aiDetection.confidenceThreshold || 85}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="99"
                      value={aiDetection.confidenceThreshold || 85}
                      onChange={(e) => handleAiSliderChange('confidenceThreshold', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#16A34A]"
                    />
                  </div>
                </div>
              </div>

              {/* Reset to Default Button */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={handleResetDefaults}
                  className="w-full flex items-center justify-center gap-1.5 border border-slate-300 hover:bg-slate-50 py-1.5 rounded text-xs font-semibold text-slate-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset to Default</span>
                </button>
              </div>
            </div>

            {/* CARD 6: ALERT PREFERENCES */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm pb-3 border-b border-slate-100">
                  <Bell className="w-4 h-4 text-[#16A34A]" />
                  <span>Alert Preferences</span>
                </div>

                <div className="mt-3.5 space-y-2 text-xs">
                  {[
                    { key: 'queueCongestionAlerts', label: 'Queue Congestion Alerts' },
                    { key: 'lowStockAlerts', label: 'Low Stock Alerts' },
                    { key: 'planogramViolationAlerts', label: 'Planogram Violation Alerts' },
                    { key: 'cameraOfflineAlerts', label: 'Camera Offline Alerts' },
                    { key: 'unusualCrowdDensityAlerts', label: 'Unusual Crowd Density Alerts' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">{item.label}</span>
                      <button
                        type="button"
                        onClick={() => handleAlertToggle(item.key, !alertPreferences[item.key])}
                        className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          alertPreferences[item.key] !== false ? 'bg-[#16A34A]' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            alertPreferences[item.key] !== false ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}

                  {/* Alert Channels Checkboxes */}
                  <div className="pt-2">
                    <span className="text-xs font-bold text-slate-800 block mb-1.5">Alert Channels</span>
                    <div className="space-y-1.5">
                      {[
                        { key: 'inApp', label: 'In-App Notification' },
                        { key: 'email', label: 'Email Alerts' },
                        { key: 'sms', label: 'SMS Alerts' },
                        { key: 'whatsapp', label: 'WhatsApp Alerts' }
                      ].map(ch => {
                        const checked = !!alertPreferences?.channels?.[ch.key];
                        return (
                          <label key={ch.key} className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleChannelToggle(ch.key)}
                              className="rounded border-slate-300 text-[#16A34A] focus:ring-[#16A34A] w-3.5 h-3.5 accent-[#16A34A]"
                            />
                            <span className="text-slate-700 text-xs">{ch.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Alert Button */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    setTestAlertResult(null);
                    setTestAlertModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 border border-slate-300 hover:bg-slate-50 py-1.5 rounded text-xs font-semibold text-slate-700 transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-slate-500" />
                  <span>Test Alert</span>
                </button>
              </div>
            </div>

            {/* CARD 7: DATA & BACKUP */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm pb-3 border-b border-slate-100">
                  <Database className="w-4 h-4 text-[#16A34A]" />
                  <span>Data &amp; Backup</span>
                </div>

                <div className="mt-3.5 space-y-3 text-xs">
                  {/* Auto Backup Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Auto Backup</span>
                    <button
                      type="button"
                      onClick={() => handleBackupChange('autoBackup', !dataBackup.autoBackup)}
                      className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        dataBackup.autoBackup !== false ? 'bg-[#16A34A]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          dataBackup.autoBackup !== false ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Backup Frequency */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Backup Frequency</span>
                    <select
                      value={dataBackup.backupFrequency || 'Daily'}
                      onChange={(e) => handleBackupChange('backupFrequency', e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#16A34A]"
                    >
                      <option value="Hourly">Hourly</option>
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>

                  {/* Retention Period */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Retention Period</span>
                    <select
                      value={dataBackup.retentionPeriod || '6 Months'}
                      onChange={(e) => handleBackupChange('retentionPeriod', e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#16A34A]"
                    >
                      <option value="30 Days">30 Days</option>
                      <option value="90 Days">90 Days</option>
                      <option value="6 Months">6 Months</option>
                      <option value="1 Year">1 Year</option>
                      <option value="Forever">Forever</option>
                    </select>
                  </div>

                  {/* Encryption / Atlas Note */}
                  <div className="mt-3 bg-emerald-50/80 border border-emerald-200/70 rounded-lg p-2.5 flex items-start gap-2 text-emerald-900">
                    <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-tight font-medium">
                      Your data is securely stored in MongoDB Atlas with encryption.
                    </span>
                  </div>
                </div>
              </div>

              {/* Backup Now Button */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  disabled={backupLoading}
                  onClick={handleBackupNow}
                  className="w-full flex items-center justify-center gap-1.5 border border-slate-300 hover:bg-slate-50 py-1.5 rounded text-xs font-semibold text-slate-700 transition-colors"
                >
                  <Cloud className={`w-3.5 h-3.5 text-slate-500 ${backupLoading ? 'animate-spin' : ''}`} />
                  <span>{backupLoading ? 'Backing up...' : 'Backup Now'}</span>
                </button>
              </div>
            </div>

            {/* CARD 8: INTEGRATIONS & DANGER ZONE */}
            <div className="flex flex-col gap-4">

              {/* Integrations Sub-card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm pb-2.5 border-b border-slate-100">
                  <Cable className="w-4 h-4 text-[#16A34A]" />
                  <span>Integrations</span>
                </div>

                <div className="mt-2.5 space-y-2 text-xs">
                  {[
                    { key: 'email', label: 'Email (SMTP)', status: integrations.email?.status || 'Connected' },
                    { key: 'sms', label: 'SMS Gateway', status: integrations.sms?.status || 'Connected' },
                    { key: 'whatsapp', label: 'WhatsApp (Twilio)', status: integrations.whatsapp?.status || 'Connected' },
                    { key: 'slack', label: 'Slack', status: integrations.slack?.status || 'Not Connected' },
                    { key: 'teams', label: 'Microsoft Teams', status: integrations.teams?.status || 'Not Connected' },
                  ].map(item => {
                    const isConnected = item.status === 'Connected';
                    return (
                      <div key={item.key} className="flex items-center justify-between">
                        <span className="text-slate-700 font-medium">{item.label}</span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1.5 text-[11px] font-medium">
                            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#16A34A]' : 'bg-slate-400'}`} />
                            <span className={isConnected ? 'text-[#16A34A]' : 'text-slate-500'}>
                              {item.status}
                            </span>
                          </span>
                          <button
                            onClick={() => openConfigureIntegration(item.key)}
                            className="text-slate-500 hover:text-slate-800 text-[11px] font-semibold underline underline-offset-2"
                          >
                            {isConnected ? 'Configure' : 'Connect'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Danger Zone Sub-card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:border-red-200 transition-colors">
                <div className="flex items-center gap-2 font-bold text-red-600 text-sm pb-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Danger Zone</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">These actions are irreversible. Please be careful.</p>

                <button
                  onClick={() => setDangerModalOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 border border-red-300 hover:bg-red-50 py-1.5 rounded text-xs font-semibold text-red-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  <span>Reset Store Data</span>
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 2: STORES (MULTI-STORE CONFIGURATION)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'stores' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Registered Store Locations</h2>
                <p className="text-xs text-slate-500">Manage stores, edge sync configurations, and multi-location telemetry.</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                {stores.length} Stores Total
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Store Name</th>
                    <th className="p-3">Code</th>
                    <th className="p-3">Region</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Edge AI</th>
                    <th className="p-3">Cameras</th>
                    <th className="p-3">Operating Hours</th>
                    <th className="p-3">Health</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stores.map((st) => (
                    <tr key={st.storeId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                        <Store className="w-4 h-4 text-[#16A34A]" />
                        <span>{st.name}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-500">{st.code}</td>
                      <td className="p-3 text-slate-700">{st.region}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          st.status === 'Online' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {st.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`flex items-center gap-1 font-medium ${st.edgeAiStatus === 'Connected' ? 'text-emerald-700' : 'text-slate-400'}`}>
                          <span className={`w-2 h-2 rounded-full ${st.edgeAiStatus === 'Connected' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {st.edgeAiStatus}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{st.cameras} Cams</td>
                      <td className="p-3 text-slate-600">{st.operatingHours}</td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900">{st.storeHealth > 0 ? `${st.storeHealth}/100` : '—'}</span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setStoreFormData({
                              name: st.name,
                              code: st.code,
                              region: st.region,
                              operatingHours: st.operatingHours,
                              contactNumber: '+91 98765 43210'
                            });
                            setEditStoreModalOpen(true);
                          }}
                          className="text-[#16A34A] hover:underline font-semibold"
                        >
                          Configure
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 3: CAMERAS & DEVICES (ACTUAL REGISTERED CAMERAS)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'cameras' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Registered Camera Registry</h2>
                <p className="text-xs text-slate-500">Live cameras synced from local Edge devices and database registry.</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                {cameras.length} Active Feeds
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cameras.map(cam => (
                <div key={cam.cameraId} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900">{cam.name}</span>
                    <span className="font-mono text-xs px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-semibold">
                      {cam.cameraId}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600 mb-3">
                    <p><span className="text-slate-400">Location:</span> {cam.location}</p>
                    <p><span className="text-slate-400">Type:</span> <span className="font-medium text-slate-800">{cam.type}</span></p>
                    <p><span className="text-slate-400">Resolution:</span> {cam.resolution}</p>
                    <p><span className="text-slate-400">Status:</span> <span className={`font-bold ${cam.status === 'ONLINE' ? 'text-emerald-600' : 'text-red-500'}`}>{cam.status}</span></p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(cam.aiModules || []).map((m: string) => (
                      <span key={m} className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded font-medium">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 4: AI & ANALYTICS (REAL ML METRICS)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Active Machine Learning Models</h2>
              <p className="text-xs text-slate-500 mb-5">
                Evaluated inference accuracy on RetailMind 1-Year Dataset. No fabricated metrics.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {mlModels.map(m => (
                  <div key={m.modelId} className="border border-slate-200 rounded-xl p-5 bg-slate-50/40 hover:border-emerald-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{m.name}</h3>
                        <p className="text-xs text-slate-500">{m.architecture} • {m.type}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                        {m.status}
                      </span>
                    </div>

                    <div className="bg-white rounded-lg border border-slate-200 p-3 mb-3">
                      <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">Evaluated Metrics</div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {Object.entries(m.metrics || {}).map(([k, v]) => (
                          <div key={k} className="bg-slate-50 rounded p-1.5">
                            <div className="text-[10px] text-slate-500 uppercase">{k}</div>
                            <div className="text-xs font-bold text-slate-900">{String(v)}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Inference Latency: <strong className="text-slate-800">{m.latency}</strong></span>
                      <span>Last Trained: <strong className="text-slate-800">{m.lastTrained}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 5: ALERTS & NOTIFICATIONS
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'alerts' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Alert Engine &amp; Escalation Policy</h2>
              <p className="text-xs text-slate-500">
                Configure automatic alert triggers, cooldown periods, and omnichannel dispatch channels.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                <h3 className="font-bold text-sm text-slate-800">Trigger Thresholds</h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Queue Congestion Wait Time</label>
                    <input type="text" defaultValue="5m 00s (Exceeds capacity)" className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Low Stock Trigger Level</label>
                    <input type="text" defaultValue="≤ 30% of Expected Stock" className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Unusual Crowd Density</label>
                    <input type="text" defaultValue="> 15 people in 100 sq.ft zone" className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800" />
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                <h3 className="font-bold text-sm text-slate-800">Dispatch Channels Status</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 bg-emerald-50 rounded border border-emerald-100">
                    <span className="font-medium text-emerald-900">In-App Notification Engine</span>
                    <span className="font-bold text-[#16A34A]">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-emerald-50 rounded border border-emerald-100">
                    <span className="font-medium text-emerald-900">Email Alerts (SMTP Relay)</span>
                    <span className="font-bold text-[#16A34A]">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-emerald-50 rounded border border-emerald-100">
                    <span className="font-medium text-emerald-900">WhatsApp Dispatch (Twilio)</span>
                    <span className="font-bold text-[#16A34A]">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200 text-slate-500">
                    <span>SMS Gateway (Twilio SMS)</span>
                    <span>Disabled in preferences</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 6: USERS & ACCESS
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Users &amp; Role-Based Access</h2>
                <p className="text-xs text-slate-500">Authorized personnel for store telemetry, ML overrides, and operational management.</p>
              </div>
              <button
                onClick={() => showToast('New user creation dialog available in Head Office mode.')}
                className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors"
              >
                + Add User
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Permissions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u.userId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <span>{u.name}</span>
                      </td>
                      <td className="p-3 text-slate-600">{u.email}</td>
                      <td className="p-3 font-semibold text-slate-800">{u.role}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {(u.permissions || []).map((p: string) => (
                            <span key={p} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] rounded">
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 7: INTEGRATIONS (FULL VIEW)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'integrations' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Third-Party Service Integrations</h2>
              <p className="text-xs text-slate-500">Configure messaging gateways, enterprise hooks, and external notification pipelines.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { key: 'email', name: 'Email (SMTP)', desc: 'Direct alert dispatch and weekly reports delivery.', status: integrations.email?.status || 'Connected' },
                { key: 'sms', name: 'SMS Gateway', desc: 'Critical stockout and manager mobile notifications.', status: integrations.sms?.status || 'Connected' },
                { key: 'whatsapp', name: 'WhatsApp (Twilio)', desc: 'Real-time alert dispatch to store supervisor phone.', status: integrations.whatsapp?.status || 'Connected' },
                { key: 'slack', name: 'Slack Webhook', desc: 'Operations channel alerts and shift summaries.', status: integrations.slack?.status || 'Not Connected' },
                { key: 'teams', name: 'Microsoft Teams', desc: 'HQ management updates and store incident alerts.', status: integrations.teams?.status || 'Not Connected' },
              ].map(item => {
                const isConnected = item.status === 'Connected';
                return (
                  <div key={item.key} className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-slate-900">{item.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-4">{item.desc}</p>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => openConfigureIntegration(item.key)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold py-1.5 rounded transition-colors text-center"
                      >
                        Configure
                      </button>
                      <button
                        onClick={() => handleTestIntegration(item.key)}
                        className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded transition-colors"
                      >
                        Test
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 8: DATA & BACKUP (FULL VIEW)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'backup' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Database &amp; Snapshot Manager</h2>
                <p className="text-xs text-slate-500">Automated backup schedules, cold storage retention, and on-demand JSON archives.</p>
              </div>
              <button
                disabled={backupLoading}
                onClick={handleBackupNow}
                className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold px-4 py-2 rounded flex items-center gap-2 transition-colors"
              >
                <Cloud className={`w-4 h-4 ${backupLoading ? 'animate-spin' : ''}`} />
                <span>{backupLoading ? 'Creating Backup...' : 'Backup Now'}</span>
              </button>
            </div>

            {lastBackupInfo && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                  <div>
                    <div className="text-xs font-bold text-emerald-900">Backup Created: {lastBackupInfo.filename}</div>
                    <div className="text-[11px] text-emerald-700">Size: {lastBackupInfo.sizeFormatted} • {lastBackupInfo.recordsCount} records archived</div>
                  </div>
                </div>
                <a
                  href={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(lastBackupInfo.data))}`}
                  download={lastBackupInfo.filename}
                  className="bg-white border border-emerald-300 hover:bg-emerald-100/50 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JSON</span>
                </a>
              </div>
            )}

            <div className="border border-slate-200 rounded-lg p-4 space-y-3">
              <h3 className="font-bold text-sm text-slate-800">Retention &amp; Storage Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded">
                  <span className="text-slate-500 block mb-1">Primary Database</span>
                  <span className="font-bold text-slate-800">MongoDB Atlas (M10 Cluster)</span>
                </div>
                <div className="bg-slate-50 p-3 rounded">
                  <span className="text-slate-500 block mb-1">Encryption Mode</span>
                  <span className="font-bold text-slate-800">TLS 1.3 + AES-256 In-Transit & At-Rest</span>
                </div>
                <div className="bg-slate-50 p-3 rounded">
                  <span className="text-slate-500 block mb-1">Configured Policy</span>
                  <span className="font-bold text-slate-800">{dataBackup.backupFrequency || 'Daily'} / {dataBackup.retentionPeriod || '6 Months'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODALS
         ══════════════════════════════════════════════════════════════════════ */}

      {/* 1. EDIT STORE INFORMATION MODAL */}
      {editStoreModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-[#16A34A]" />
                <span>Edit Store Information</span>
              </h3>
              <button onClick={() => setEditStoreModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStoreInfo} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Store Name *</label>
                <input
                  type="text"
                  required
                  value={storeFormData.name || ''}
                  onChange={(e) => setStoreFormData({ ...storeFormData, name: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#16A34A]"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Store Code *</label>
                <input
                  type="text"
                  required
                  value={storeFormData.code || ''}
                  onChange={(e) => setStoreFormData({ ...storeFormData, code: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#16A34A]"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Address *</label>
                <textarea
                  required
                  rows={2}
                  value={storeFormData.address || ''}
                  onChange={(e) => setStoreFormData({ ...storeFormData, address: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#16A34A]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Region</label>
                  <input
                    type="text"
                    value={storeFormData.region || ''}
                    onChange={(e) => setStoreFormData({ ...storeFormData, region: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#16A34A]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={storeFormData.operatingHours || ''}
                    onChange={(e) => setStoreFormData({ ...storeFormData, operatingHours: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#16A34A]"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Contact Number</label>
                <input
                  type="text"
                  value={storeFormData.contactNumber || ''}
                  onChange={(e) => setStoreFormData({ ...storeFormData, contactNumber: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#16A34A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditStoreModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold rounded"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. LOGO MODAL */}
      {logoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#16A34A]" />
                <span>Upload Store Logo</span>
              </h3>
              <button onClick={() => setLogoModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <p className="text-slate-500">Provide an image URL or choose a local asset for your store badge.</p>
              <input
                type="text"
                placeholder="https://example.com/store-logo.png"
                value={customLogoUrl}
                onChange={(e) => setCustomLogoUrl(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#16A34A]"
              />

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setLogoModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (customLogoUrl) {
                      await handleBrandColorChange(branding.brandColor);
                      showToast('Logo updated successfully!');
                    }
                    setLogoModalOpen(false);
                  }}
                  className="px-3 py-1.5 bg-[#16A34A] text-white font-semibold rounded"
                >
                  Save Logo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TEST ALERT MODAL */}
      {testAlertModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-[#16A34A]" />
                <span>Test Alert Notification</span>
              </h3>
              <button onClick={() => setTestAlertModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <label className="block text-slate-700 font-medium">Select Channel</label>
              <select
                value={testAlertChannel}
                onChange={(e) => setTestAlertChannel(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#16A34A]"
              >
                <option value="WhatsApp">WhatsApp (Twilio)</option>
                <option value="Email">Email (SMTP)</option>
                <option value="In-App">In-App Notification</option>
              </select>

              {testAlertResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>Alert Sent Successfully</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">{testAlertResult.message}</p>
                  <p className="text-[10px] text-emerald-600 font-mono">ID: {testAlertResult.notificationId}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setTestAlertModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 font-semibold"
                >
                  Close
                </button>
                <button
                  disabled={saving}
                  onClick={handleSendTestAlert}
                  className="px-4 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold rounded"
                >
                  {saving ? 'Sending...' : 'Dispatch Test'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. CONFIGURE INTEGRATION MODAL */}
      {integrationModalKey && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Cable className="w-4 h-4 text-[#16A34A]" />
                <span>Configure {integrationFormData.name || integrationModalKey}</span>
              </h3>
              <button onClick={() => setIntegrationModalKey(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIntegration} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={integrationFormData.status || 'Connected'}
                  onChange={(e) => setIntegrationFormData({ ...integrationFormData, status: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 font-medium"
                >
                  <option value="Connected">Connected</option>
                  <option value="Not Connected">Not Connected</option>
                  <option value="Error">Error</option>
                </select>
              </div>

              {integrationModalKey === 'email' && (
                <>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">SMTP Host</label>
                    <input
                      type="text"
                      value={integrationFormData.host || ''}
                      onChange={(e) => setIntegrationFormData({ ...integrationFormData, host: e.target.value })}
                      className="w-full border border-slate-300 rounded px-3 py-1.5"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Port</label>
                      <input
                        type="number"
                        value={integrationFormData.port || 587}
                        onChange={(e) => setIntegrationFormData({ ...integrationFormData, port: parseInt(e.target.value) })}
                        className="w-full border border-slate-300 rounded px-3 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">From Address</label>
                      <input
                        type="text"
                        value={integrationFormData.from || ''}
                        onChange={(e) => setIntegrationFormData({ ...integrationFormData, from: e.target.value })}
                        className="w-full border border-slate-300 rounded px-3 py-1.5"
                      />
                    </div>
                  </div>
                </>
              )}

              {integrationModalKey === 'whatsapp' && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Twilio WhatsApp Phone Number</label>
                  <input
                    type="text"
                    value={integrationFormData.phoneNumber || ''}
                    onChange={(e) => setIntegrationFormData({ ...integrationFormData, phoneNumber: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5"
                  />
                </div>
              )}

              {(integrationModalKey === 'slack' || integrationModalKey === 'teams') && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Incoming Webhook URL</label>
                  <input
                    type="text"
                    placeholder="https://hooks.slack.com/services/..."
                    value={integrationFormData.webhookUrl || ''}
                    onChange={(e) => setIntegrationFormData({ ...integrationFormData, webhookUrl: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5"
                  />
                </div>
              )}

              {testResult && (
                <div className={`p-2.5 rounded text-xs ${testResult.success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                  {testResult.message}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={testingIntegration}
                  onClick={() => handleTestIntegration(integrationModalKey)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded"
                >
                  {testingIntegration ? 'Testing...' : 'Test Connection'}
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIntegrationModalKey(null)}
                    className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DANGER ZONE CONFIRMATION MODAL */}
      {dangerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-red-200">
            <div className="flex items-center gap-2 text-red-600 pb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base">Reset Store Data?</h3>
            </div>
            <p className="text-xs text-slate-600 mt-2">
              This will clear transient test alerts, reset camera simulation queues to baseline, and restore healthy inventory status.
            </p>

            <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDangerModalOpen(false)}
                className="px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleConfirmResetStoreData}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded"
              >
                {saving ? 'Resetting...' : 'Yes, Reset Data'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SettingsPage;
