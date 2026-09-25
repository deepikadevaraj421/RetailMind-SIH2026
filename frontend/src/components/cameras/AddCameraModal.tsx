import React, { useState } from 'react';
import { Camera, CameraType } from '../../types';
import { createCamera } from '../../services/api';
import { X, Video, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface AddCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCameraAdded: (cam: Camera) => void;
}

export const AddCameraModal: React.FC<AddCameraModalProps> = ({
  isOpen,
  onClose,
  onCameraAdded,
}) => {
  const [name, setName] = useState('');
  const [cameraId, setCameraId] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<CameraType>('SHELF');
  const [zone, setZone] = useState('');
  const [resolution, setResolution] = useState('1080p');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&auto=format&fit=crop&q=80');
  const [streamUrl, setStreamUrl] = useState('');
  const [status, setStatus] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [aiModules, setAiModules] = useState('Person detection, Stock detection');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim() || !cameraId.trim() || !location.trim()) {
      setErrorMsg('Please fill in Camera Name, Camera ID, and Location.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: Partial<Camera> = {
        name: name.trim(),
        cameraId: cameraId.trim().toUpperCase(),
        location: location.trim(),
        type,
        zone: zone.trim() || location.trim(),
        resolution,
        imageUrl: imageUrl.trim(),
        streamUrl: streamUrl.trim() || undefined,
        status,
        aiModules: aiModules.split(',').map((m) => m.trim()).filter(Boolean),
        peopleCount: type === 'ENTRANCE' || type === 'FLOOR' ? 5 : 0,
        queueLength: type === 'CHECKOUT' ? 2 : 0,
        currentStock: type === 'SHELF' ? 10 : 0,
        expectedStock: type === 'SHELF' ? 10 : 0,
        stockStatus: 'Healthy',
        density: 'Normal',
        planogramCompliancePct: 98,
        shelfHealthScore: 92,
      };

      const res = await createCamera(payload);
      if (res.success && res.data) {
        setSuccessMsg(`Camera ${res.data.cameraId} successfully saved to MongoDB!`);
        onCameraAdded(res.data);
        setTimeout(() => {
          onClose();
          // Reset form
          setName('');
          setCameraId('');
          setLocation('');
        }, 1200);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save camera';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Add New Camera</h2>
              <p className="text-[11px] text-slate-500">Register new camera into RetailMind Edge system</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Alert */}
        {errorMsg && (
          <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2 text-xs text-emerald-700">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Camera Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Cam 13 – Bakery Aisle"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Camera ID *</label>
              <input
                type="text"
                required
                placeholder="e.g. CAM13"
                value={cameraId}
                onChange={(e) => setCameraId(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Location *</label>
              <input
                type="text"
                required
                placeholder="e.g. Bakery Section"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Camera Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CameraType)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
              >
                <option value="ENTRANCE">Entrance</option>
                <option value="SHELF">Shelf</option>
                <option value="CHECKOUT">Checkout</option>
                <option value="FLOOR">Floor</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Resolution</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
              >
                <option value="1080p">1080p (Full HD)</option>
                <option value="4K">4K (Ultra HD)</option>
                <option value="720p">720p (HD)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
              >
                <option value="ONLINE">ONLINE</option>
                <option value="OFFLINE">OFFLINE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Simulated Image URL *</label>
            <input
              type="url"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">AI Modules</label>
            <input
              type="text"
              value={aiModules}
              onChange={(e) => setAiModules(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving to DB...</span>
                </>
              ) : (
                <span>Save Camera</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
