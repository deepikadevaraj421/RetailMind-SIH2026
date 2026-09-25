import React, { useState } from 'react';
import { Camera, TimelineEventItem } from '../../types';
import { X, Maximize2, Bell, AlertTriangle, CheckCircle, Clock, MapPin, Eye, Package, ShieldAlert } from 'lucide-react';

interface CameraDetailsPanelProps {
  camera: Camera | null;
  onClose: () => void;
  onFullscreen: (cam: Camera) => void;
  onSendAlert: (cam: Camera) => void;
  cameraEvents: TimelineEventItem[];
}

export const CameraDetailsPanel: React.FC<CameraDetailsPanelProps> = ({
  camera,
  onClose,
  onFullscreen,
  onSendAlert,
  cameraEvents,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'stock' | 'planogram' | 'events'>('details');

  if (!camera) {
    return (
      <div className="w-80 md:w-96 bg-white border-l border-slate-200 p-6 flex flex-col items-center justify-center text-center text-slate-400">
        <Eye className="w-10 h-10 stroke-[1.2] mb-2 text-slate-300" />
        <p className="text-xs font-semibold text-slate-600">Select a camera</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Click any camera feed to inspect live AI metrics, stock, and planogram data.</p>
      </div>
    );
  }

  // Stock percentage calculation (Section 21)
  const stockPercentage = camera.expectedStock > 0 ? Math.round((camera.currentStock / camera.expectedStock) * 100) : 0;
  const reorderQty = Math.max(0, camera.expectedStock - camera.currentStock);

  const timestampStr = React.useMemo(() => {
    const d = new Date();
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    const time = d.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${day} ${month} ${year} ${time}`;
  }, [camera.lastUpdated]);

  return (
    <div className="w-80 md:w-96 bg-white border-l border-slate-200 flex flex-col h-full shrink-0 shadow-lg z-10 select-none">
      {/* Panel Top Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Camera Details</h2>
          <div className="text-sm font-extrabold text-slate-900 mt-0.5">
            {camera.name} {camera.cameraId === 'CAM03' && '(Milk)'}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Camera Live Preview with Bounding Box */}
      <div className="p-4 pb-2">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner">
          <img
            src={camera.imageUrl}
            alt={camera.name}
            className="w-full h-full object-cover"
          />
          {/* Live Tag */}
          <div className="absolute top-2 left-2 flex items-center space-x-1 px-1.5 py-0.5 rounded bg-black/75 border border-emerald-500/40 text-[10px] font-bold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>LIVE</span>
          </div>

          <div className="absolute top-2 right-2 text-[10px] text-slate-300 font-mono bg-black/60 px-1.5 py-0.5 rounded">
            {timestampStr}
          </div>

          {/* AI Detection Overlay */}
          {camera.cameraId === 'CAM03' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative border-2 border-red-500/90 bg-red-500/10 rounded px-6 py-8">
                <span className="absolute -top-3.5 left-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                  Misplaced Item
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Working Tabs */}
      <div className="px-4 border-b border-slate-200">
        <div className="flex space-x-1">
          {[
            { id: 'details', label: 'Details' },
            { id: 'stock', label: 'Stock Info' },
            { id: 'planogram', label: 'Planogram' },
            { id: 'events', label: 'Events' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
        {/* TAB 1: DETAILS */}
        {activeTab === 'details' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-400" /> Camera Type
              </span>
              <span className="font-bold text-slate-800">{camera.type} Camera</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Location
              </span>
              <span className="font-semibold text-slate-800">{camera.location}</span>
            </div>

            {camera.type === 'SHELF' && (
              <>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Current Stock</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{camera.currentStock} / {camera.expectedStock}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        camera.stockStatus === 'Low Stock'
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {camera.stockStatus}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Planogram Compliance</span>
                  <span className="font-bold text-red-600">
                    {camera.misplacedItemsCount > 0 ? `${camera.misplacedItemsCount} misplaced item` : 'Compliant'}
                  </span>
                </div>

                <div className="py-1.5 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-500">Shelf Health</span>
                    <span className="font-bold text-slate-900">{camera.shelfHealthScore} / 100</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        camera.shelfHealthScore < 50
                          ? 'bg-red-500'
                          : camera.shelfHealthScore < 75
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${camera.shelfHealthScore}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Predicted Stock-out
                  </span>
                  <span className="font-bold text-slate-900">~18 minutes</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-400" /> Last Alert
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-600 font-mono text-[11px]">06:10 PM</span>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Staff notified
                    </span>
                  </div>
                </div>
              </>
            )}

            {camera.type === 'CHECKOUT' && (
              <>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Current Queue</span>
                  <span className="font-bold text-slate-900 text-sm">{camera.queueLength} people</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Active Counters</span>
                  <span className="font-semibold text-slate-800">2 open</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">ML Predicted Queue</span>
                  <span className="font-bold text-amber-600">~12 in next 10m</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Congestion Recommendation</span>
                  <span className="font-semibold text-emerald-700">Open Counter 3</span>
                </div>
              </>
            )}

            {(camera.type === 'ENTRANCE' || camera.type === 'FLOOR') && (
              <>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">People Count</span>
                  <span className="font-bold text-slate-900 text-sm">{camera.peopleCount} visitors</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Shopper Density</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                      camera.density === 'High'
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {camera.density}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: STOCK INFO */}
        {activeTab === 'stock' && (
          <div className="space-y-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Product</span>
                <span className="font-bold text-slate-900">{camera.cameraId === 'CAM03' ? 'Amul Taaza Milk 1L' : 'Packaged Goods'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SKU</span>
                <span className="font-mono text-slate-700">SKU-001-DAIRY</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expected Stock</span>
                <span className="font-bold text-slate-800">{camera.expectedStock} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Stock</span>
                <span className="font-bold text-slate-900">{camera.currentStock} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stock Availability</span>
                <span className={`font-bold ${stockPercentage <= 30 ? 'text-red-600' : 'text-emerald-700'}`}>
                  {stockPercentage}%
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Daily Demand</span>
                <span className="font-semibold text-slate-800">4 units / day</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Demand Rate</span>
                <span className="font-semibold text-slate-800">Medium</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Replenishment Quantity</span>
                <span className="font-bold text-emerald-600">{reorderQty} units required</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Warehouse Stock</span>
                <span className="font-semibold text-slate-800">45 units in backstore</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PLANOGRAM */}
        {activeTab === 'planogram' && (
          <div className="space-y-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-slate-500 text-[11px]">Planogram Compliance</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {camera.planogramCompliancePct}%
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${camera.planogramCompliancePct}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Expected Position</span>
                <span className="font-semibold text-slate-800">Slot A3-04</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Detected Position</span>
                <span className="font-semibold text-red-600">Slot A3-05</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Misplaced Product</span>
                <span className="font-semibold text-slate-800">Flavored Milk Tetra</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Misplaced Count</span>
                <span className="font-bold text-red-600">{camera.misplacedItemsCount}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: EVENTS */}
        {activeTab === 'events' && (
          <div className="space-y-2.5">
            {cameraEvents.length === 0 ? (
              <p className="text-slate-400 text-center py-6">No recent events for this camera.</p>
            ) : (
              cameraEvents.map((evt, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono text-slate-500">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={`font-bold px-1.5 py-0.2 rounded ${
                        evt.severity === 'Critical'
                          ? 'bg-red-100 text-red-700'
                          : evt.severity === 'Warning'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {evt.severity}
                    </span>
                  </div>
                  <div className="font-bold text-slate-800">{evt.title}</div>
                  <p className="text-[11px] text-slate-600">{evt.description}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Buttons (Section 63) */}
      <div className="p-4 border-t border-slate-200 grid grid-cols-2 gap-2.5 bg-slate-50/70">
        <button
          onClick={() => onFullscreen(camera)}
          className="flex items-center justify-center space-x-1.5 py-2 px-3 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white transition-colors shadow-2xs"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>View Full Screen</span>
        </button>

        <button
          onClick={() => onSendAlert(camera)}
          className="flex items-center justify-center space-x-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Send Alert</span>
        </button>
      </div>
    </div>
  );
};
