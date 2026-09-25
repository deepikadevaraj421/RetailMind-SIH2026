import React, { useState } from 'react';
import { Camera } from '../../types';
import { X, ZoomIn, ZoomOut, RotateCcw, Users, ShoppingCart, Package } from 'lucide-react';

interface FullscreenModalProps {
  camera: Camera | null;
  onClose: () => void;
}

export const FullscreenModal: React.FC<FullscreenModalProps> = ({ camera, onClose }) => {
  const [zoom, setZoom] = useState(1.0);

  if (!camera) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 md:p-6 animate-in fade-in duration-150 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="text-white font-extrabold text-base md:text-lg">{camera.name}</div>
          <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-400 font-bold text-xs">
            ● LIVE
          </span>
          <span className="text-slate-400 font-mono text-xs">{camera.cameraId} • {camera.location}</span>
          <span className="text-slate-500 text-xs">(SIMULATED LIVE)</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-white/10 rounded-lg p-1 mr-2">
            <button
              onClick={() => setZoom((z) => Math.min(3.0, z + 0.25))}
              className="p-1.5 text-white hover:bg-white/20 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(1.0, z - 0.25))}
              className="p-1.5 text-white hover:bg-white/20 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="p-1.5 text-white hover:bg-white/20 rounded"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Stream Area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden my-4">
        <div className="relative max-w-5xl w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 shadow-2xl border border-white/10 flex items-center justify-center">
          <img
            src={camera.imageUrl}
            alt={camera.name}
            style={{
              transform: `scale(${zoom})`,
              transition: 'transform 0.15s ease-out',
            }}
            className="w-full h-full object-contain"
          />

          {camera.cameraId === 'CAM03' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative border-2 border-red-500/90 bg-red-500/10 rounded-lg px-12 py-14">
                <span className="absolute -top-4 left-3 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded shadow-sm">
                  Misplaced Item Detected
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 max-w-5xl mx-auto w-full flex items-center justify-between text-xs text-white">
        <div className="flex items-center space-x-6">
          {camera.type === 'ENTRANCE' || camera.type === 'FLOOR' ? (
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Footfall Count: <strong className="text-white">{camera.peopleCount} people</strong></span>
            </div>
          ) : camera.type === 'CHECKOUT' ? (
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
              <span>Checkout Queue: <strong className="text-white">{camera.queueLength} customers</strong></span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>Shelf Stock: <strong className="text-white">{camera.currentStock} / {camera.expectedStock} units</strong></span>
            </div>
          )}
          <span>Status: <strong className="text-emerald-400">{camera.status}</strong></span>
          <span>Resolution: <strong className="text-white">{camera.resolution}</strong></span>
        </div>

        <div className="text-slate-400 text-[11px] font-mono">
          Edge Device: EDGE-01 • FPS: 30
        </div>
      </div>
    </div>
  );
};
