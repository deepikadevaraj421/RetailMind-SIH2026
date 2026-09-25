export interface ReportData {
  summary: {
    totalFootfall: number;
    footfallChangePct: number;
    avgDwellTime: string;
    dwellChangePct: number;
    totalEntries: number;
    entriesChangePct: number;
    totalExits: number;
    exitsChangePct: number;
  };
  footfallTrend: Array<{ date: string; shortDate: string; footfall: number }>;
  topZones: Array<{ zone: string; count: number }>;
  detailedRows: Array<{
    date: string;
    footfall: number;
    entries: number;
    exits: number;
    avgDwellTime: string;
    peakHour: string;
    busiestZone: string;
  }>;
  reportSummary: {
    reportType: string;
    store: string;
    dateRange: string;
    period: string;
    generatedOn: string;
    generatedBy: string;
  };
}

const DEFAULT_REPORT_DATA: ReportData = {
  summary: {
    totalFootfall: 18452,
    footfallChangePct: 12,
    avgDwellTime: '4m 32s',
    dwellChangePct: 8,
    totalEntries: 9312,
    entriesChangePct: 11,
    totalExits: 9140,
    exitsChangePct: 10
  },
  footfallTrend: [
    { date: '2026-09-01', shortDate: 'Sep 01', footfall: 620 },
    { date: '2026-09-02', shortDate: 'Sep 02', footfall: 840 },
    { date: '2026-09-03', shortDate: 'Sep 03', footfall: 1050 },
    { date: '2026-09-04', shortDate: 'Sep 04', footfall: 1320 },
    { date: '2026-09-05', shortDate: 'Sep 05', footfall: 1380 },
    { date: '2026-09-06', shortDate: 'Sep 06', footfall: 1040 },
    { date: '2026-09-07', shortDate: 'Sep 07', footfall: 1210 },
    { date: '2026-09-08', shortDate: 'Sep 08', footfall: 1360 },
    { date: '2026-09-09', shortDate: 'Sep 09', footfall: 1480 },
    { date: '2026-09-10', shortDate: 'Sep 10', footfall: 1720 },
    { date: '2026-09-11', shortDate: 'Sep 11', footfall: 1540 },
    { date: '2026-09-12', shortDate: 'Sep 12', footfall: 1380 },
    { date: '2026-09-13', shortDate: 'Sep 13', footfall: 1190 },
    { date: '2026-09-14', shortDate: 'Sep 14', footfall: 1482 }
  ],
  topZones: [
    { zone: 'Grocery', count: 3842 },
    { zone: 'Fruits & Veg', count: 2946 },
    { zone: 'Snacks', count: 2184 },
    { zone: 'Dairy', count: 1876 },
    { zone: 'Cosmetics', count: 1240 }
  ],
  detailedRows: [
    { date: '14 Sep 2026', footfall: 1482, entries: 751, exits: 731, avgDwellTime: '4m 32s', peakHour: '6:00 PM', busiestZone: 'Grocery' },
    { date: '13 Sep 2026', footfall: 1326, entries: 682, exits: 644, avgDwellTime: '4m 18s', peakHour: '5:00 PM', busiestZone: 'Fruits & Veg' },
    { date: '12 Sep 2026', footfall: 1410, entries: 715, exits: 695, avgDwellTime: '4m 11s', peakHour: '6:00 PM', busiestZone: 'Grocery' },
    { date: '11 Sep 2026', footfall: 1698, entries: 861, exits: 837, avgDwellTime: '4m 49s', peakHour: '6:00 PM', busiestZone: 'Snacks' },
    { date: '10 Sep 2026', footfall: 1522, entries: 783, exits: 739, avgDwellTime: '4m 36s', peakHour: '5:00 PM', busiestZone: 'Grocery' },
    { date: '09 Sep 2026', footfall: 1356, entries: 690, exits: 666, avgDwellTime: '4m 20s', peakHour: '6:00 PM', busiestZone: 'Fruits & Veg' },
    { date: '08 Sep 2026', footfall: 1284, entries: 658, exits: 626, avgDwellTime: '4m 18s', peakHour: '6:00 PM', busiestZone: 'Snacks' },
    { date: '07 Sep 2026', footfall: 1112, entries: 571, exits: 541, avgDwellTime: '3m 54s', peakHour: '5:00 PM', busiestZone: 'Dairy' },
    { date: '06 Sep 2026', footfall: 1436, entries: 732, exits: 704, avgDwellTime: '4m 21s', peakHour: '6:00 PM', busiestZone: 'Grocery' },
    { date: '05 Sep 2026', footfall: 1298, entries: 670, exits: 628, avgDwellTime: '4m 08s', peakHour: '5:00 PM', busiestZone: 'Fruits & Veg' }
  ],
  reportSummary: {
    reportType: 'Shopper Analytics',
    store: 'Chennai – Anna Nagar',
    dateRange: '01 Sep 2026 – 14 Sep 2026',
    period: 'Daily',
    generatedOn: '14 Sep 2026, 11:16 PM',
    generatedBy: 'Store Admin'
  }
};

export const ReportService = {
  getReportData(reportType = 'Shopper Analytics', store = 'Chennai – Anna Nagar', period = 'Daily'): ReportData {
    const data = JSON.parse(JSON.stringify(DEFAULT_REPORT_DATA));
    data.reportSummary.reportType = reportType;
    data.reportSummary.store = store;
    data.reportSummary.period = period;
    data.reportSummary.generatedOn = new Date().toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return data;
  },

  generateCsv(reportType = 'Shopper Analytics', store = 'Chennai – Anna Nagar'): string {
    const data = this.getReportData(reportType, store);
    let csv = `RetailMind - ${data.reportSummary.reportType} Report\n`;
    csv += `Store: ${data.reportSummary.store}, Period: ${data.reportSummary.dateRange}\n`;
    csv += `Generated On: ${data.reportSummary.generatedOn} by ${data.reportSummary.generatedBy}\n\n`;

    csv += `SUMMARY METRICS\n`;
    csv += `Total Footfall,${data.summary.totalFootfall}\n`;
    csv += `Avg Dwell Time,${data.summary.avgDwellTime}\n`;
    csv += `Total Entries,${data.summary.totalEntries}\n`;
    csv += `Total Exits,${data.summary.totalExits}\n\n`;

    csv += `TOP PERFORMING ZONES\n`;
    csv += `Zone,Visitors\n`;
    for (const z of data.topZones) {
      csv += `"${z.zone}",${z.count}\n`;
    }
    csv += `\n`;

    csv += `DETAILED DAILY BREAKDOWN\n`;
    csv += `Date,Footfall,Entries,Exits,Avg Dwell Time,Peak Hour,Busiest Zone\n`;
    for (const r of data.detailedRows) {
      csv += `"${r.date}",${r.footfall},${r.entries},${r.exits},"${r.avgDwellTime}","${r.peakHour}","${r.busiestZone}"\n`;
    }

    return csv;
  }
};
