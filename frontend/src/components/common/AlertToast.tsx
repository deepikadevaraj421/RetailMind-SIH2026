import React, { useEffect } from 'react';
import { NotificationItem } from '../../types';
import { AlertCircle, AlertTriangle, CheckCircle, Bell, X } from 'lucide-react';

interface AlertToastProps {
  notification: NotificationItem | null;
  onDismiss: () => void;
}

export const AlertToast: React.FC<AlertToastProps> = ({ notification, onDismiss }) => {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [notification, onDismiss]);

  if (!notification) return null;

  const isCritical = notification.severity === 'Critical';
  const isWarning = notification.severity === 'Warning';

  return (
    <div className="fixed top-20 right-6 z-50 max-w-sm w-full bg-white rounded-xl shadow-2xl border border-slate-200 p-4 animate-in slide-in-from-top-4 duration-200 select-none">
      <div className="flex items-start space-x-3">
        <div
          className={`p-2 rounded-lg shrink-0 ${
            isCritical ? 'bg-red-100 text-red-600' : isWarning ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
          }`}
        >
          {isCritical ? (
            <AlertCircle className="w-5 h-5" />
          ) : isWarning ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              AI Alert
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {new Date(notification.generatedAt).toLocaleTimeString()}
            </span>
          </div>

          <h4 className="text-xs font-bold text-slate-900 mt-1">{notification.title}</h4>
          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{notification.message}</p>
          <div className="mt-2 text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Staff notified automatically</span>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 p-1 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
