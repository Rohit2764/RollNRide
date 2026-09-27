import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Building2, 
  Car, 
  DollarSign, 
  RefreshCw 
} from 'lucide-react';
import { api } from '../../api/client';
import { OperationsDashboardResponse, Warehouse } from '../../types';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<'fleet' | 'warehouse' | 'revenue' | 'traffic'>('fleet');
  const [dateRange, setDateRange] = useState<string>('7d');

  const { data: dashboard, isLoading, refetch } = useQuery<OperationsDashboardResponse>({
    queryKey: ['operations-dashboard'],
    queryFn: () => api.get<OperationsDashboardResponse>('/analytics/dashboard')
  });

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ['warehouses'],
    queryFn: () => api.get<Warehouse[]>('/warehouses')
  });

  // Export CSV Function
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    const timestamp = new Date().toISOString().slice(0, 10);

    if (reportType === 'fleet') {
      csvContent += "Time,Fleet Utilization (%)\n";
      dashboard?.fleet_utilization_trend.forEach(row => {
        csvContent += `"${row.time}",${row.utilization}\n`;
      });
    } else if (reportType === 'warehouse') {
      csvContent += "Depot Code,Depot Name,Workload Score,Capacity,Vehicles In Depot,Status\n";
      warehouses?.forEach(w => {
        csvContent += `"${w.code}","${w.name}",${w.workload_score},${w.capacity},${w.current_vehicle_count},"${w.status}"\n`;
      });
    } else if (reportType === 'revenue') {
      csvContent += "Date,Revenue ($),Trips Completed\n";
      dashboard?.revenue_trend.forEach(r => {
        csvContent += `"${r.date}",${r.revenue},${r.trips}\n`;
      });
    } else {
      csvContent += "Zone Code,Congestion Level,Average Speed (km/h),Active Trips\n";
      csvContent += `"NETWORK","${dashboard?.traffic.current_congestion_level}",${dashboard?.traffic.average_speed_kmh},${dashboard?.traffic.active_trips}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RollNRide_${reportType}_report_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 print:p-0 print:m-0">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            Executive Reports & BI Export
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Generate auditor-ready operational summaries, CSV data extracts, and printable PDF briefs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-medium transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-400" />
            Export CSV
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print / PDF Brief
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-4 rounded-2xl print:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setReportType('fleet')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
              reportType === 'fleet'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            Fleet Utilization
          </button>

          <button
            onClick={() => setReportType('warehouse')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
              reportType === 'warehouse'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Depot Workloads
          </button>

          <button
            onClick={() => setReportType('revenue')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
              reportType === 'revenue'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Bookings & Revenue
          </button>

          <button
            onClick={() => setReportType('traffic')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
              reportType === 'traffic'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Traffic & Congestion
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-300 outline-none cursor-pointer"
          >
            <option value="today">Today (Real-time snapshot)</option>
            <option value="7d">Last 7 Days (Trailing)</option>
            <option value="30d">Last 30 Days (Monthly)</option>
          </select>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 sm:p-8 space-y-8 print:bg-white print:text-black print:border-none print:shadow-none">
        {/* Document Header */}
        <div className="border-b border-slate-700/60 pb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <h2 className="text-xl font-bold tracking-tight text-slate-100 print:text-black">
                RollNRide Mobility Intelligence Report
              </h2>
            </div>
            <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
              Autonomous Smart Fleet, Depot Load & Traffic Telematics Platform
            </p>
          </div>

          <div className="text-right text-xs text-slate-400 print:text-gray-600 font-mono">
            <p>Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
            <p className="mt-0.5">Report Scope: {reportType.toUpperCase()}</p>
            <p className="mt-0.5">Depot Region: Greater Hyderabad</p>
          </div>
        </div>

        {/* Executive Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 print:border-gray-300 print:bg-gray-50">
            <span className="text-xs text-slate-400 print:text-gray-600 uppercase font-semibold">Total Fleet</span>
            <p className="text-2xl font-bold text-slate-100 print:text-black mt-1">
              {dashboard?.fleet.total_vehicles ?? 0}
            </p>
            <p className="text-2xs text-slate-500 print:text-gray-500 mt-0.5">Vehicles in network</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 print:border-gray-300 print:bg-gray-50">
            <span className="text-xs text-slate-400 print:text-gray-600 uppercase font-semibold">Fleet Utilization</span>
            <p className="text-2xl font-bold text-emerald-400 print:text-emerald-700 mt-1">
              {dashboard?.fleet.utilization_rate ?? 0}%
            </p>
            <p className="text-2xs text-slate-500 print:text-gray-500 mt-0.5">{dashboard?.fleet.in_use_vehicles} vehicles in-use</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 print:border-gray-300 print:bg-gray-50">
            <span className="text-xs text-slate-400 print:text-gray-600 uppercase font-semibold">Avg Hub Workload</span>
            <p className="text-2xl font-bold text-blue-400 print:text-blue-700 mt-1">
              {dashboard?.warehouse.average_workload ?? 0}/100
            </p>
            <p className="text-2xs text-slate-500 print:text-gray-500 mt-0.5">5 active distribution hubs</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 print:border-gray-300 print:bg-gray-50">
            <span className="text-xs text-slate-400 print:text-gray-600 uppercase font-semibold">Today&apos;s Revenue</span>
            <p className="text-2xl font-bold text-amber-400 print:text-amber-700 mt-1">
              ${dashboard?.bookings.revenue_today.toFixed(2) ?? '0.00'}
            </p>
            <p className="text-2xs text-slate-500 print:text-gray-500 mt-0.5">{dashboard?.bookings.today_count} trips booked</p>
          </div>
        </div>

        {/* Section 1: Detailed Table according to report type */}
        {reportType === 'fleet' && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-slate-200 print:text-black">
              Fleet Utilization Profile & Status Distribution
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300 print:text-black border-collapse">
                <thead className="text-xs uppercase bg-slate-900/80 print:bg-gray-100 text-slate-400 print:text-gray-700 border-b border-slate-700 print:border-gray-300">
                  <tr>
                    <th className="px-4 py-3">Metric Category</th>
                    <th className="px-4 py-3">Vehicle Count</th>
                    <th className="px-4 py-3">Share of Fleet</th>
                    <th className="px-4 py-3">Operational Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 print:divide-gray-300">
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-200 print:text-black">Active Trips (In-Use)</td>
                    <td className="px-4 py-3 font-mono">{dashboard?.fleet.in_use_vehicles}</td>
                    <td className="px-4 py-3 font-mono">{dashboard?.fleet.utilization_rate}%</td>
                    <td className="px-4 py-3 text-xs text-emerald-400 print:text-emerald-700">Generating live trip revenue</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-200 print:text-black">Available at Depots</td>
                    <td className="px-4 py-3 font-mono">{dashboard?.fleet.available_vehicles}</td>
                    <td className="px-4 py-3 font-mono">
                      {Math.round(((dashboard?.fleet.available_vehicles || 0) / (dashboard?.fleet.total_vehicles || 1)) * 100)}%
                    </td>
                    <td className="px-4 py-3 text-xs text-blue-400 print:text-blue-700">Ready for instant customer booking</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-200 print:text-black">Cleaning & Turnaround Queue</td>
                    <td className="px-4 py-3 font-mono">{dashboard?.fleet.cleaning_vehicles}</td>
                    <td className="px-4 py-3 font-mono">
                      {Math.round(((dashboard?.fleet.cleaning_vehicles || 0) / (dashboard?.fleet.total_vehicles || 1)) * 100)}%
                    </td>
                    <td className="px-4 py-3 text-xs text-amber-400 print:text-amber-700">In bay sanitization workflow</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-200 print:text-black">Under Maintenance</td>
                    <td className="px-4 py-3 font-mono">{dashboard?.fleet.maintenance_vehicles}</td>
                    <td className="px-4 py-3 font-mono">
                      {Math.round(((dashboard?.fleet.maintenance_vehicles || 0) / (dashboard?.fleet.total_vehicles || 1)) * 100)}%
                    </td>
                    <td className="px-4 py-3 text-xs text-rose-400 print:text-rose-700">Diagnostic triage & overhaul</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'warehouse' && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-slate-200 print:text-black">
              Depot Workload & Vehicle Capacity Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300 print:text-black border-collapse">
                <thead className="text-xs uppercase bg-slate-900/80 print:bg-gray-100 text-slate-400 print:text-gray-700 border-b border-slate-700 print:border-gray-300">
                  <tr>
                    <th className="px-4 py-3">Depot</th>
                    <th className="px-4 py-3">Capacity</th>
                    <th className="px-4 py-3">Vehicles Present</th>
                    <th className="px-4 py-3">Workload Score</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 print:divide-gray-300">
                  {warehouses?.map((w) => (
                    <tr key={w.id}>
                      <td className="px-4 py-3 font-medium text-slate-200 print:text-black">
                        {w.name} ({w.code})
                      </td>
                      <td className="px-4 py-3 font-mono">{w.capacity}</td>
                      <td className="px-4 py-3 font-mono">{w.current_vehicle_count}</td>
                      <td className="px-4 py-3 font-mono font-semibold">
                        <span className={w.workload_score > 75 ? 'text-rose-400' : 'text-slate-200'}>
                          {w.workload_score} / 100
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {w.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'revenue' && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-slate-200 print:text-black">
              Financial Summary & Completed Booking Trends
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300 print:text-black border-collapse">
                <thead className="text-xs uppercase bg-slate-900/80 print:bg-gray-100 text-slate-400 print:text-gray-700 border-b border-slate-700 print:border-gray-300">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Daily Revenue ($)</th>
                    <th className="px-4 py-3">Completed Trips</th>
                    <th className="px-4 py-3">Avg Value / Trip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 print:divide-gray-300">
                  {dashboard?.revenue_trend.map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 font-medium text-slate-200 print:text-black">{row.date}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-emerald-400 print:text-emerald-700">
                        ${row.revenue.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 font-mono">{row.trips}</td>
                      <td className="px-4 py-3 font-mono text-slate-300 print:text-black">
                        ${(row.revenue / Math.max(1, row.trips)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'traffic' && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-slate-200 print:text-black">
              Hyderabad Arterial Corridors & Speed Sensor Observations
            </h3>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Current Congestion Status:</span>
                <span className="font-bold text-amber-400 uppercase">{dashboard?.traffic.current_congestion_level}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Network Average Speed:</span>
                <span className="font-bold text-slate-200">{dashboard?.traffic.average_speed_kmh} km/h</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Active Live Trips on Corridors:</span>
                <span className="font-bold text-slate-200">{dashboard?.traffic.active_trips} trips</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Active Road Incidents / Bottlenecks:</span>
                <span className="font-bold text-rose-400">{dashboard?.traffic.active_incidents} reported</span>
              </div>
            </div>
          </div>
        )}

        {/* AI Recommendations Summary */}
        <div className="p-5 rounded-2xl bg-blue-950/20 border border-blue-500/30 print:border-gray-300 print:bg-gray-50">
          <h4 className="text-sm font-semibold text-blue-300 print:text-blue-900 mb-2">
            Automated Intelligence System Sign-off
          </h4>
          <p className="text-xs text-slate-300 print:text-gray-700 leading-relaxed">
            Data aggregated via continuous telematics telemetry sampling at 2Hz. Workload calculations comply with the standard multi-factor depot pressure formula (0.25B + 0.20D + 0.15R + 0.15M + 0.10C + 0.15S). Recommended vehicle redistribution transfers should be approved in the Optimization module to avert predicted shortages.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
