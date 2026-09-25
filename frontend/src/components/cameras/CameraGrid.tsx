import React from 'react';
import { Camera } from '../../types';
import { CameraCard } from './CameraCard';
import { VideoOff } from 'lucide-react';

interface CameraGridProps {
  cameras: Camera[];
  isLoading: boolean;
  selectedCamera: Camera | null;
  onSelectCamera: (cam: Camera) => void;
  onFullscreenCamera: (cam: Camera) => void;
  viewMode: 'grid' | 'list';
}

export const CameraGrid: React.FC<CameraGridProps> = ({
  cameras,
  isLoading,
  selectedCamera,
  onSelectCamera,
  onFullscreenCamera,
  viewMode,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-video bg-slate-200 animate-pulse rounded-xl border border-slate-300/80"></div>
        ))}
      </div>
    );
  }

  if (cameras.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <VideoOff className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">No cameras found</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          No camera matches your current search or category filter. Try selecting another tab or clear search.
        </p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="p-4 space-y-3">
        {cameras.map((cam) => (
          <div
            key={cam.cameraId}
            onClick={() => onSelectCamera(cam)}
            className={`flex items-center justify-between p-3 rounded-xl border bg-white cursor-pointer transition-all shadow-2xs hover:shadow-xs ${
              selectedCamera?.cameraId === cam.cameraId
                ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center space-x-4">
              <img
                src={cam.imageUrl}
                alt={cam.name}
                className="w-16 h-12 object-cover rounded-lg bg-slate-900 shrink-0"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900">{cam.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                    {cam.cameraId}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    {cam.type}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{cam.location} • {cam.resolution}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {cam.type === 'CHECKOUT' && (
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-800">{cam.queueLength} in queue</span>
                  <div className="text-[10px] text-slate-500">Checkout</div>
                </div>
              )}
              {cam.type === 'SHELF' && (
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-800">{cam.currentStock}/{cam.expectedStock} stock</span>
                  <div className="text-[10px] text-slate-500">{cam.stockStatus}</div>
                </div>
              )}
              {(cam.type === 'ENTRANCE' || cam.type === 'FLOOR') && (
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-800">{cam.peopleCount} visitors</span>
                  <div className="text-[10px] text-slate-500">{cam.density} density</div>
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFullscreenCamera(cam);
                }}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600"
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
      {cameras.map((cam) => (
        <CameraCard
          key={cam.cameraId}
          camera={cam}
          isSelected={selectedCamera?.cameraId === cam.cameraId}
          onSelect={onSelectCamera}
          onFullscreen={onFullscreenCamera}
        />
      ))}
    </div>
  );
};
