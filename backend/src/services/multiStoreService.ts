export interface MultiStoreSummary {
  totalStores: number;
  totalStoresDelta: string;
  totalCities: number;
  storesOnline: number;
  storesOnlineDelta: string;
  onlinePct: string;
  totalFootfallToday: number;
  footfallChangePct: number;
  yesterdayFootfall: number;
  activeAlerts: number;
  alertsDelta: string;
  storesWithAlerts: number;
  storesNeedingAttention: number;
  attentionDelta: string;
}

export interface StorePerformanceRow {
  storeId: string;
  code: string;
  name: string;
  city: string;
  region: string;
  imageUrl: string;
  status: 'Online' | 'Offline' | 'Warning';
  footfallToday: number;
  inventoryAvailability: number | null;
  avgQueue: number | null;
  avgWaitTime: string;
  storeHealth: number;
  alertsCount: number;
  edgeAiStatus: string;
}

const STORE_PERFORMANCE_DATA: StorePerformanceRow[] = [
  {
    storeId: 'STORE001',
    code: 'ST001',
    name: 'Chennai – Anna Nagar',
    city: 'Chennai',
    region: 'Chennai',
    imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&auto=format&fit=crop&q=80',
    status: 'Online',
    footfallToday: 2842,
    inventoryAvailability: 94.2,
    avgQueue: 6,
    avgWaitTime: '4m 20s',
    storeHealth: 91,
    alertsCount: 2,
    edgeAiStatus: 'Connected'
  },
  {
    storeId: 'STORE002',
    code: 'ST002',
    name: 'Coimbatore – RS Puram',
    city: 'Coimbatore',
    region: 'Coimbatore',
    imageUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=300&auto=format&fit=crop&q=80',
    status: 'Online',
    footfallToday: 1216,
    inventoryAvailability: 91.8,
    avgQueue: 8,
    avgWaitTime: '5m 10s',
    storeHealth: 84,
    alertsCount: 4,
    edgeAiStatus: 'Connected'
  },
  {
    storeId: 'STORE003',
    code: 'ST003',
    name: 'Madurai – KK Nagar',
    city: 'Madurai',
    region: 'Madurai',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80',
    status: 'Online',
    footfallToday: 1984,
    inventoryAvailability: 89.6,
    avgQueue: 7,
    avgWaitTime: '4m 50s',
    storeHealth: 87,
    alertsCount: 3,
    edgeAiStatus: 'Connected'
  },
  {
    storeId: 'STORE004',
    code: 'ST004',
    name: 'Salem – Hasthampatti',
    city: 'Salem',
    region: 'Salem',
    imageUrl: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=300&auto=format&fit=crop&q=80',
    status: 'Online',
    footfallToday: 982,
    inventoryAvailability: 76.4,
    avgQueue: 12,
    avgWaitTime: '6m 30s',
    storeHealth: 72,
    alertsCount: 5,
    edgeAiStatus: 'Connected'
  },
  {
    storeId: 'STORE005',
    code: 'ST005',
    name: 'Trichy – Thillai Nagar',
    city: 'Trichy',
    region: 'Trichy',
    imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300&auto=format&fit=crop&q=80',
    status: 'Online',
    footfallToday: 1642,
    inventoryAvailability: 92.1,
    avgQueue: 5,
    avgWaitTime: '3m 45s',
    storeHealth: 88,
    alertsCount: 1,
    edgeAiStatus: 'Connected'
  },
  {
    storeId: 'STORE006',
    code: 'ST006',
    name: 'Tirunelveli – Vannarpettai',
    city: 'Tirunelveli',
    region: 'Tirunelveli',
    imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=300&auto=format&fit=crop&q=80',
    status: 'Offline',
    footfallToday: 0,
    inventoryAvailability: null,
    avgQueue: null,
    avgWaitTime: '—',
    storeHealth: 0,
    alertsCount: 1,
    edgeAiStatus: 'Disconnected'
  }
];

export const MultiStoreService = {
  getSummary(): MultiStoreSummary {
    return {
      totalStores: 12,
      totalStoresDelta: '↑ 1',
      totalCities: 4,
      storesOnline: 11,
      storesOnlineDelta: '↑ 1',
      onlinePct: '91.7% online',
      totalFootfallToday: 18642,
      footfallChangePct: 12,
      yesterdayFootfall: 16624,
      activeAlerts: 23,
      alertsDelta: '↑ 6',
      storesWithAlerts: 5,
      storesNeedingAttention: 3,
      attentionDelta: '↑ 1'
    };
  },

  getStorePerformance(query: { search?: string; region?: string; status?: string; performance?: string } = {}) {
    let list = [...STORE_PERFORMANCE_DATA];

    if (query.search) {
      const q = query.search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
    }

    if (query.region && query.region !== 'All' && query.region !== 'All Regions') {
      list = list.filter(s => s.region.toLowerCase() === query.region!.toLowerCase() || s.city.toLowerCase() === query.region!.toLowerCase());
    }

    if (query.status && query.status !== 'All' && query.status !== 'All Status') {
      list = list.filter(s => s.status.toLowerCase() === query.status!.toLowerCase());
    }

    if (query.performance && query.performance !== 'All' && query.performance !== 'All Performance') {
      if (query.performance === 'Excellent') {
        list = list.filter(s => s.storeHealth >= 90);
      } else if (query.performance === 'Good') {
        list = list.filter(s => s.storeHealth >= 80 && s.storeHealth < 90);
      } else if (query.performance === 'Needs Attention') {
        list = list.filter(s => s.storeHealth > 0 && s.storeHealth < 80);
      }
    }

    return list;
  },

  getFootfallComparison(period = 'Today') {
    const mult = period === 'Week' ? 6.8 : period === 'Month' ? 28.5 : 1.0;
    return [
      { name: 'Anna Nagar', short: 'Anna Nagar', footfall: Math.round(2842 * mult) },
      { name: 'RS Puram', short: 'RS Puram', footfall: Math.round(1216 * mult) },
      { name: 'Madurai', short: 'Madurai', footfall: Math.round(1984 * mult) },
      { name: 'Salem', short: 'Salem', footfall: Math.round(982 * mult) },
      { name: 'Trichy', short: 'Trichy', footfall: Math.round(1642 * mult) },
      { name: 'Tirunelveli', short: 'Tirunelveli', footfall: Math.round(1366 * mult) }
    ];
  },

  getStoresNeedingAttention() {
    return [
      {
        id: 'att_1',
        storeName: 'Chennai – Anna Nagar',
        city: 'Chennai',
        severity: 'Critical',
        title: 'Queue congestion predicted at Counter 2',
        detail: 'Expected 15 customers in 10 minutes',
        badge: 'Critical'
      },
      {
        id: 'att_2',
        storeName: 'Salem – Hasthampatti',
        city: 'Salem',
        severity: 'Warning',
        title: 'Milk & Beverages low stock',
        detail: '8 replenishment tasks pending',
        badge: 'Warning'
      },
      {
        id: 'att_3',
        storeName: 'Madurai – KK Nagar',
        city: 'Madurai',
        severity: 'Warning',
        title: 'Planogram compliance: 81%',
        detail: '5 shelves need attention',
        badge: 'Warning'
      }
    ];
  },

  getOverallHealth() {
    return {
      score: 82,
      maxScore: 100,
      label: 'Good',
      categories: [
        { label: 'Excellent (2)', count: 2, color: '#16A34A' },
        { label: 'Good (6)', count: 6, color: '#22C55E' },
        { label: 'Needs Attention (3)', count: 3, color: '#F59E0B' },
        { label: 'Critical (1)', count: 1, color: '#EF4444' }
      ]
    };
  },

  getAiInsights() {
    return [
      {
        id: 'ins_1',
        type: 'up',
        title: 'Chennai – Anna Nagar is today\'s top-performing store',
        description: 'Footfall is 18% above its 7-day average.',
        highlightColor: 'emerald'
      },
      {
        id: 'ins_2',
        type: 'down',
        title: 'Salem – Hasthampatti needs attention',
        description: 'Inventory availability dropped below 80%.',
        highlightColor: 'red'
      },
      {
        id: 'ins_3',
        type: 'alert',
        title: 'Madurai – KK Nagar has rising queue pressure',
        description: 'Average waiting time increased by 35% during evening peak.',
        highlightColor: 'amber'
      },
      {
        id: 'ins_4',
        type: 'up',
        title: 'Trichy – Thillai Nagar is improving',
        description: 'Queue length reduced by 22% compared to last week.',
        highlightColor: 'emerald'
      }
    ];
  },

  getRecentActivity() {
    return [
      {
        id: 'act_1',
        time: '11:16 AM',
        type: 'critical',
        text: 'Queue congestion predicted at Chennai – Anna Nagar (Counter 2)'
      },
      {
        id: 'act_2',
        time: '10:48 AM',
        type: 'success',
        text: 'Stock replenished – Milk (Salem – Hasthampatti)'
      },
      {
        id: 'act_3',
        time: '09:32 AM',
        type: 'warning',
        text: 'Planogram issue detected (Madurai – KK Nagar)'
      },
      {
        id: 'act_4',
        time: '08:15 AM',
        type: 'critical',
        text: 'Camera offline (Tirunelveli – Vannarpettai)'
      },
      {
        id: 'act_5',
        time: '07:42 AM',
        type: 'success',
        text: 'Store health improved (Trichy – Thillai Nagar)'
      }
    ];
  }
};
