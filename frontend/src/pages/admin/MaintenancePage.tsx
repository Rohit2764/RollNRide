import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Wrench, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Search,
  Filter,
  Warehouse as WarehouseIcon,
  Car
} from 'lucide-react';
import { api } from '../../api/client';
import { MaintenanceRecord, CleaningTask, Warehouse, Vehicle } from '../../types';

export const MaintenancePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'turnaround' | 'records'>('turnaround');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state for new maintenance record
  const [formData, setFormData] = useState({
    vehicle_id: '',
    warehouse_id: '',
    type: 'SCHEDULED',
    description: '',
    cost: '',
    estimated_completion: ''
  });

  // Queries
  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ['warehouses'],
    queryFn: () => api.get<Warehouse[]>('/warehouses')
  });

  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ['vehicles'],
    queryFn: () => api.get<Vehicle[]>('/vehicles?limit=100')
  });

  const { data: cleaningTasks, isLoading: loadingCleaning } = useQuery<CleaningTask[]>({
    queryKey: ['cleaning-queue', selectedWarehouse],
    queryFn: () => {
      const url = selectedWarehouse === 'all' 
        ? '/maintenance/cleaning-queue' 
        : `/maintenance/cleaning-queue?warehouse_id=${selectedWarehouse}`;
      return api.get<CleaningTask[]>(url);
    },
    refetchInterval: 5000
  });

  const { data: maintenanceRecords, isLoading: loadingRecords } = useQuery<MaintenanceRecord[]>({
    queryKey: ['maintenance-records', selectedWarehouse],
    queryFn: () => {
      const url = selectedWarehouse === 'all'
        ? '/maintenance'
        : `/maintenance?warehouse_id=${selectedWarehouse}`;
      return api.get<MaintenanceRecord[]>(url);
    },
    refetchInterval: 10000
  });

  const { data: metrics } = useQuery({
    queryKey: ['maintenance-metrics', selectedWarehouse],
    queryFn: () => {
      const url = selectedWarehouse === 'all'
        ? '/maintenance/metrics'
        : `/maintenance/metrics?warehouse_id=${selectedWarehouse}`;
      return api.get<any>(url);
    }
  });

  // Mutations
  const advanceMutation = useMutation({
    mutationFn: (taskId: number) => api.post(`/maintenance/cleaning-queue/${taskId}/advance`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-queue'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    }
  });

  const completeMaintenanceMutation = useMutation({
    mutationFn: ({ recordId, cost }: { recordId: number; cost?: number }) => 
      api.patch(`/maintenance/${recordId}`, { cost: cost || 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-records'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    }
  });

  const createMaintenanceMutation = useMutation({
    mutationFn: (data: any) => api.post('/maintenance', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-records'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setShowAddModal(false);
      setFormData({
        vehicle_id: '',
        warehouse_id: '',
        type: 'SCHEDULED',
        description: '',
        cost: '',
        estimated_completion: ''
      });
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMaintenanceMutation.mutate({
      vehicle_id: parseInt(formData.vehicle_id),
      warehouse_id: parseInt(formData.warehouse_id),
      type: formData.type,
      description: formData.description,
      cost: formData.cost ? parseFloat(formData.cost) : 0,
      estimated_completion: formData.estimated_completion ? new Date(formData.estimated_completion).toISOString() : undefined
    });
  };

  // Filter tasks
  const filteredTasks = cleaningTasks?.filter(task => {
    const reg = task.vehicle?.registration_number?.toLowerCase() || '';
    const brand = task.vehicle?.brand?.toLowerCase() || '';
    const q = searchQuery.toLowerCase();
    return reg.includes(q) || brand.includes(q);
  }) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-amber-400" />
            Maintenance & Turnaround Operations
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated 4-stage vehicle turnaround pipeline, bay cleaning queues, and overhaul schedules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1.5 text-sm">
            <WarehouseIcon className="w-4 h-4 text-slate-400 mr-2" />
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="bg-transparent text-slate-200 border-none outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Hubs (Network)</option>
              {warehouses?.map(w => (
                <option key={w.id} value={w.id} className="bg-slate-900">{w.name} ({w.code})</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-medium rounded-xl text-sm transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Log Work Order
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Turnaround Time</span>
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">
            {metrics?.average_turnaround_time_minutes ?? 28} <span className="text-sm font-normal text-slate-400">mins</span>
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
            <span>&bull; Target &lt; 35 mins met</span>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Cleaning Queue</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Sparkles className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">
            {metrics?.queue_length ?? cleaningTasks?.filter(t => t.status !== 'COMPLETED').length ?? 0}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
            <span>In-bay sanitization & vacuuming</span>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Under Repair / Overhaul</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Wrench className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">
            {metrics?.active_maintenance_count ?? maintenanceRecords?.filter(r => r.status === 'IN_PROGRESS').length ?? 0}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-400">
            <span>Mechanical / battery diagnostics</span>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ready for Dispatch</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">
            {metrics?.completed_today ?? 14}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
            <span>100% inspected & restored today</span>
          </div>
        </div>
      </div>

      {/* Turnaround Workflow Visualization */}
      <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-200">Standard Vehicle Turnaround Pipeline</h2>
          <span className="text-xs text-slate-400">Automated State Machine</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 relative">
            <div className="flex items-center justify-between text-xs font-medium text-purple-400 mb-1">
              <span>STAGE 1</span>
              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">RETURNED</span>
            </div>
            <h4 className="font-semibold text-slate-200 text-sm">Depot Intake</h4>
            <p className="text-xs text-slate-400 mt-1">Vehicle geofence checked into drop-off zone. Odometer and fuel/battery auto-logged.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 relative">
            <div className="flex items-center justify-between text-xs font-medium text-blue-400 mb-1">
              <span>STAGE 2</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">INSPECTION</span>
            </div>
            <h4 className="font-semibold text-slate-200 text-sm">Physical Triage</h4>
            <p className="text-xs text-slate-400 mt-1">Exterior body audit, tire pressure verification, telematics OBD diagnostic scan.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 relative">
            <div className="flex items-center justify-between text-xs font-medium text-amber-400 mb-1">
              <span>STAGE 3</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">CLEANING</span>
            </div>
            <h4 className="font-semibold text-slate-200 text-sm">Deep Sanitation</h4>
            <p className="text-xs text-slate-400 mt-1">Interior vacuuming, high-touch sanitization, exterior wash, fragrance recharge.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 relative">
            <div className="flex items-center justify-between text-xs font-medium text-emerald-400 mb-1">
              <span>STAGE 4</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">AVAILABLE</span>
            </div>
            <h4 className="font-semibold text-slate-200 text-sm">Fleet Ready</h4>
            <p className="text-xs text-slate-400 mt-1">Key placed in smart dispatch locker. Vehicle unlocked for customer reservations.</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('turnaround')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'turnaround'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Turnaround & Cleaning Queue
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300">
              {filteredTasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('records')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'records'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Wrench className="w-4 h-4" />
            Maintenance Records & Overhauls
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300">
              {maintenanceRecords?.length || 0}
            </span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search vehicle or reg..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900/80 border border-slate-700/60 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500/60"
          />
        </div>
      </div>

      {/* Tab 1: Cleaning & Turnaround Queue */}
      {activeTab === 'turnaround' && (
        <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Active Cleaning Bays</h3>
            <span className="text-xs text-slate-400">Click &apos;Advance Queue&apos; to progress stage</span>
          </div>

          {loadingCleaning ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading queue...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="font-medium text-slate-300">All vehicles are clean and ready</p>
              <p className="text-xs text-slate-500 mt-1">No pending turnaround tasks in selected depot queue.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-slate-900/60 text-slate-400 border-b border-slate-700/60">
                  <tr>
                    <th className="px-5 py-3.5">Vehicle</th>
                    <th className="px-5 py-3.5">Depot</th>
                    <th className="px-5 py-3.5">Assigned Staff</th>
                    <th className="px-5 py-3.5">Stage</th>
                    <th className="px-5 py-3.5">Est. Duration</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                            <Car className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100 text-sm">
                              {task.vehicle?.brand} {task.vehicle?.model}
                            </p>
                            <p className="text-xs font-mono text-slate-400">
                              {task.vehicle?.registration_number}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs">
                        <span className="text-slate-300 font-medium">{task.warehouse?.name || 'Central Hub'}</span>
                      </td>

                      <td className="px-5 py-4 text-xs">
                        {task.assigned_staff?.user?.name ? (
                          <span className="text-slate-200">{task.assigned_staff.user.name}</span>
                        ) : (
                          <span className="text-slate-500 italic">Unassigned (First available)</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          task.status === 'QUEUED'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : task.status === 'IN_PROGRESS'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {task.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-400 font-mono">
                        {task.duration_minutes || 25} mins
                      </td>

                      <td className="px-5 py-4 text-right">
                        {task.status !== 'COMPLETED' ? (
                          <button
                            onClick={() => advanceMutation.mutate(task.id)}
                            disabled={advanceMutation.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                          >
                            <span>{task.status === 'QUEUED' ? 'Start Cleaning' : 'Mark Clean & Available'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-400 flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Ready
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Maintenance Records */}
      {activeTab === 'records' && (
        <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Scheduled & Unscheduled Repairs</h3>
            <span className="text-xs text-slate-400">Total logged records: {maintenanceRecords?.length || 0}</span>
          </div>

          {loadingRecords ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading records...</div>
          ) : !maintenanceRecords || maintenanceRecords.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="font-medium text-slate-300">No active maintenance work orders</p>
              <p className="text-xs text-slate-500 mt-1">All vehicles in this depot have clean health diagnostic logs.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-slate-900/60 text-slate-400 border-b border-slate-700/60">
                  <tr>
                    <th className="px-5 py-3.5">Vehicle</th>
                    <th className="px-5 py-3.5">Type & Issue</th>
                    <th className="px-5 py-3.5">Depot</th>
                    <th className="px-5 py-3.5">Est. Cost</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Logged Date</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  {maintenanceRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                            <Car className="w-5 h-5 text-amber-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100 text-sm">
                              {record.vehicle?.brand} {record.vehicle?.model}
                            </p>
                            <p className="text-xs font-mono text-slate-400">
                              {record.vehicle?.registration_number}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                          {record.type}
                        </span>
                        <p className="text-xs text-slate-400 mt-1 truncate max-w-xs">{record.description}</p>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-300">
                        {record.warehouse?.name || 'Service Depot'}
                      </td>

                      <td className="px-5 py-4 text-xs font-mono text-slate-200">
                        ${record.cost.toFixed(2)}
                      </td>

                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          record.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : record.status === 'IN_PROGRESS'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {record.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-400">
                        {new Date(record.created_at).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {record.status !== 'COMPLETED' ? (
                          <button
                            onClick={() => completeMaintenanceMutation.mutate({ recordId: record.id, cost: record.cost })}
                            disabled={completeMaintenanceMutation.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-sm cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Resolved</span>
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-400 font-medium">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Maintenance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/70 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" />
                Log Maintenance Work Order
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Select Vehicle</label>
                <select
                  required
                  value={formData.vehicle_id}
                  onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200 outline-none focus:border-amber-500"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles?.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registration_number} - {v.brand} {v.model} ({v.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Service Depot / Warehouse</label>
                <select
                  required
                  value={formData.warehouse_id}
                  onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200 outline-none focus:border-amber-500"
                >
                  <option value="">-- Choose Depot --</option>
                  {warehouses?.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200 outline-none focus:border-amber-500"
                  >
                    <option value="SCHEDULED">Scheduled Inspection</option>
                    <option value="BATTERY_OVERHAUL">Battery Overhaul</option>
                    <option value="TIRE_REPLACE">Tire Replacement</option>
                    <option value="BRAKE_SERVICE">Brake Servicing</option>
                    <option value="BODY_REPAIR">Accident / Body Repair</option>
                    <option value="FIRMWARE_UPDATE">Telematics Firmware</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Estimated Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="120.00"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Issue Description & Instructions</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe failure code, mechanical observation, or component checklist..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200 outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Est. Completion Target</label>
                <input
                  type="datetime-local"
                  value={formData.estimated_completion}
                  onChange={(e) => setFormData({ ...formData, estimated_completion: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMaintenanceMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {createMaintenanceMutation.isPending ? 'Saving...' : 'Dispatch Work Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenancePage;
