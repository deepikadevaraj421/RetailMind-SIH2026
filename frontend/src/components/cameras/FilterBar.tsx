import React from 'react';
import { CameraCounts, CameraType } from '../../types';
import { Search, LayoutGrid, List, Plus, Layers, DoorOpen, Package, ShoppingCart, Users } from 'lucide-react';

interface FilterBarProps {
  activeTab: 'ALL' | CameraType;
  onTabChange: (tab: 'ALL' | CameraType) => void;
  counts: CameraCounts;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onAddCameraClick: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  activeTab,
  onTabChange,
  counts,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onAddCameraClick,
}) => {
  const tabs: { id: 'ALL' | CameraType; label: string; count: number; icon: any }[] = [
    { id: 'ALL', label: 'All Cameras', count: counts.all, icon: Layers },
    { id: 'ENTRANCE', label: 'Entrance', count: counts.entrance, icon: DoorOpen },
    { id: 'SHELF', label: 'Shelves', count: counts.shelves, icon: Package },
    { id: 'CHECKOUT', label: 'Checkout', count: counts.checkout, icon: ShoppingCart },
    { id: 'FLOOR', label: 'Floor', count: counts.floor, icon: Users },
  ];

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 bg-white border-b border-slate-200">
      {/* Filter Tabs */}
      <div className="flex items-center flex-wrap gap-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right Controls: Search, View Toggle, Add Camera */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search (e.g., shelf, queue, A3...)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        {/* Grid / List Toggle */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shadow-2xs">
          <button
            onClick={() => onViewModeChange('grid')}
            title="Grid View"
            className={`p-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Grid</span>
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            title="List View"
            className={`p-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all ${
              viewMode === 'list'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">List</span>
          </button>
        </div>

        {/* Add Camera Button */}
        <button
          onClick={onAddCameraClick}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Camera</span>
        </button>
      </div>
    </div>
  );
};
