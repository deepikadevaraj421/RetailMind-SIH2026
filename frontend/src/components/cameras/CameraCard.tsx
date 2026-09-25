import React, { useState } from 'react';
import { Camera } from '../../types';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, MoreVertical, Users, AlertCircle, ShoppingBag, EyeOff } from 'lucide-react';

interface CameraCardProps {
  camera: Camera;
  isSelected?: boolean;
  onSelect: (camera: Camera) => void;
  onFullscreen: (camera: Camera) => void;
}

export const CameraCard: React.FC<CameraCardProps> = ({
  camera,
  isSelected = false,
  onSelect,
  onFullscreen,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [imageError, setImageError] = useState(false);

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.min(2.5, prev + 0.25));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.max(1.0, prev - 0.25));
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(1.0);
  };

  const handleFullscreenClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFullscreen(camera);
  };

  // Format live timestamp
  const timestampStr = React.useMemo(() => {
    const d = new Date();
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    const time = d.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${day} ${month} ${year} ${time}`;
  }, [camera.lastUpdated]);

  return (
    <div
      onClick={() => onSelect(camera)}
      className={`group relative bg-slate-900 border rounded-xl overflow-hidden cursor-pointer shadow-sm transition-all duration-200 ${
        isSelected
          ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
          : 'border-slate-800 hover:border-slate-700 hover:shadow-md'
      }`}
    >
      {/* Top Header Overlay Bar */}
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between p-2.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-white drop-shadow-xs">{camera.name}</span>
          {camera.status === 'ONLINE' ? (
            <span className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-bold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>LIVE</span>
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded bg-red-950/80 border border-red-500/40 text-[10px] font-bold text-red-400">
              OFFLINE
            </span>
          )}
          <span className="px-1 py-0.5 rounded bg-black/60 text-[9px] text-slate-300 font-medium">
            SIMULATED
          </span>
        </div>

        <div className="text-[10px] text-slate-300 font-mono drop-shadow-xs">
          {timestampStr}
        </div>
      </div>

      {/* Camera Feed Frame */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-950 flex items-center justify-center">
        {imageError ? (
          <div className="flex flex-col items-center justify-center text-slate-500 p-4 text-center">
            <EyeOff className="w-8 h-8 mb-2 stroke-[1.5]" />
            <p className="text-xs font-semibold text-slate-400">Camera feed unavailable</p>
            <p className="text-[10px] text-slate-600 mt-0.5">Check network / edge connection</p>
          </div>
        ) : (
          <img
            src={camera.imageUrl}
            alt={camera.name}
            onError={() => setImageError(true)}
            style={{
              transform: `scale(${zoomLevel})`,
              transition: 'transform 0.2s ease-out',
            }}
            className="w-full h-full object-cover select-none"
          />
        )}

        {/* AI Bounding Box Overlays */}
        {camera.cameraId === 'CAM03' && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative border-2 border-red-500/90 bg-red-500/10 rounded px-8 py-10">
              <span className="absolute -top-3.5 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                Misplaced Item
              </span>
            </div>
          </div>
        )}

        {camera.cameraId === 'CAM04' && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative border-2 border-dashed border-red-500/80 bg-red-500/5 rounded px-7 py-7">
              <span className="absolute -top-3 left-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                Missing product
              </span>
            </div>
          </div>
        )}

        {/* Bottom Floating Stats Bar */}
        <div className="absolute bottom-2 left-2 z-10 flex items-center space-x-2">
          {/* People Count for Entrance & Floor */}
          {(camera.type === 'ENTRANCE' || camera.type === 'FLOOR') && (
            <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-xs border border-white/10 text-white text-xs font-semibold shadow-sm">
              <Users className="w-3.5 h-3.5 text-slate-300" />
              <span>{camera.peopleCount} people</span>
            </span>
          )}

          {/* Queue Count for Checkout */}
          {camera.type === 'CHECKOUT' && (
            <div className="flex items-center space-x-1.5">
              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-xs border border-white/10 text-white text-xs font-semibold shadow-sm">
                <Users className="w-3.5 h-3.5 text-slate-300" />
                <span>{camera.queueLength} people</span>
              </span>
              {camera.queueLength >= 8 && (
                <span className="px-2 py-1 rounded-md bg-red-600 text-white text-[11px] font-bold shadow-sm">
                  High Queue
                </span>
              )}
            </div>
          )}

          {/* Stock Info for Shelf */}
          {camera.type === 'SHELF' && (
            <div className="flex items-center space-x-1.5">
              <span className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-xs border border-white/10 text-white text-xs font-semibold shadow-sm">
                <span>Stock: {camera.currentStock} / {camera.expectedStock}</span>
              </span>
              {camera.stockStatus === 'Low Stock' && (
                <span className="px-2 py-1 rounded-md bg-red-600/95 text-white text-[11px] font-bold shadow-sm">
                  Low Stock
                </span>
              )}
              {camera.stockStatus === 'Out of Stock' && (
                <span className="px-2 py-1 rounded-md bg-red-700 text-white text-[11px] font-bold shadow-sm">
                  Out of Stock
                </span>
              )}
              {camera.planogramCompliancePct < 90 && (
                <span className="px-2 py-1 rounded-md bg-amber-600 text-white text-[11px] font-bold shadow-sm">
                  Planogram issue
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom Right Card Controls: Zoom In, Zoom Out, Reset, Fullscreen, More */}
        <div className="absolute bottom-2 right-2 z-10 flex items-center space-x-1 bg-black/70 backdrop-blur-xs border border-white/10 rounded-lg p-1">
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          {zoomLevel > 1 && (
            <button
              onClick={handleResetZoom}
              title="Reset Zoom"
              className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-white/10 rounded transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleFullscreenClick}
            title="Fullscreen"
            className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(camera);
            }}
            title="More Options"
            className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
