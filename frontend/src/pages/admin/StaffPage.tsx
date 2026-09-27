import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  UserCheck, 
  Clock, 
  Activity, 
  CheckCircle, 
  Search, 
  Filter, 
  Warehouse as WarehouseIcon,
  Shield,
  Edit2,
  Calendar,
  Award
} from 'lucide-react';
import { api } from '../../api/client';
import { Staff, Warehouse } from '../../types';

export const StaffPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    working_status: '',
    shift: '',
    current_task: ''
  });

  // Queries
  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ['warehouses'],
    queryFn: () => api.get<Warehouse[]>('/warehouses')
  });

  const { data: staffList, isLoading } = useQuery<Staff[]>({
    queryKey: ['staff', selectedWarehouse],
    queryFn: () => {
      const url = selectedWarehouse === 'all' ? '/staff' : `/staff?warehouse_id=${selectedWarehouse}`;
      return api.get<Staff[]>(url);
    },
    refetchInterval: 10000
  });

  const { data: workloadMetrics } = useQuery({
    queryKey: ['staff-workload'],
    queryFn: () => api.get<any>('/staff/workload'),
    refetchInterval: 10000
  });

  // Update staff mutation
  const updateStaffMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.patch(`/staff/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staff-workload'] });
      setEditingStaff(null);
    }
  });

  const handleEditClick = (staff: Staff) => {
    setEditingStaff(staff);
    setEditForm({
      working_status: staff.working_status,
      shift: staff.shift,
      current_task: staff.current_task || ''
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    updateStaffMutation.mutate({
      id: editingStaff.id,
      data: editForm
    });
  };

  // Filtered staff list
  const filteredStaff = staffList?.filter(s => {
    const nameMatch = s.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      s.employee_code.toLowerCase().includes(searchQuery.toLowerCase());
    const shiftMatch = selectedShift === 'all' || s.shift === selectedShift;
    return nameMatch && shiftMatch;
  }) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            Depot Workforce & Staff Operations
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time technician rosters, shift assignments, and daily bay task distribution.
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
              <option value="all" className="bg-slate-900">All Depots</option>
              {warehouses?.map(w => (
                <option key={w.id} value={w.id} className="bg-slate-900">{w.name} ({w.code})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Workforce</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">
            {workloadMetrics?.total_staff ?? staffList?.length ?? 0}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
            <span>Active depot personnel</span>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Currently On Duty</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">
            {workloadMetrics?.on_duty ?? 0}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
            <span>Ready for dispatches & cleaning</span>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tasks Completed Today</span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <CheckCircle className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">
            {workloadMetrics?.total_tasks_completed ?? 0}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-purple-400">
            <span>Inspections, dispatches & turnarounds</span>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Efficiency Rating</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Award className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">
            {workloadMetrics?.average_efficiency ?? 94.2}%
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-400">
            <span>Based on turnaround SLA adherence</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-4 rounded-2xl">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by staff name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700/60 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500/60"
            />
          </div>

          <div className="flex items-center bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 py-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="bg-transparent text-slate-200 border-none outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Shifts</option>
              <option value="MORNING" className="bg-slate-900">Morning (06:00 - 14:00)</option>
              <option value="EVENING" className="bg-slate-900">Evening (14:00 - 22:00)</option>
              <option value="NIGHT" className="bg-slate-900">Night (22:00 - 06:00)</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400 self-end sm:self-auto">
          Showing <span className="font-semibold text-slate-200">{filteredStaff.length}</span> staff members
        </div>
      </div>

      {/* Staff Directory Table */}
      <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading staff roster...</div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="font-medium text-slate-300">No staff found matching filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-900/60 text-slate-400 border-b border-slate-700/60">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Assigned Depot</th>
                  <th className="px-5 py-3.5">Shift</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Current Task</th>
                  <th className="px-5 py-3.5">Tasks Today</th>
                  <th className="px-5 py-3.5">Efficiency</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {filteredStaff.map((staff) => {
                  const warehouse = warehouses?.find(w => w.id === staff.warehouse_id);
                  return (
                    <tr key={staff.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-xs">
                            {staff.user?.name.slice(0, 2).toUpperCase() || 'ST'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100 text-sm">
                              {staff.user?.name || 'Staff Member'}
                            </p>
                            <p className="text-xs font-mono text-slate-400">
                              {staff.employee_code}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs font-medium text-slate-300">
                        {warehouse?.name || `Hub #${staff.warehouse_id}`}
                      </td>

                      <td className="px-5 py-4 text-xs">
                        <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                          {staff.shift}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          staff.working_status === 'ON_DUTY'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : staff.working_status === 'ASSIGNED'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : staff.working_status === 'ON_BREAK'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-700 text-slate-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            staff.working_status === 'ON_DUTY' ? 'bg-emerald-400' :
                            staff.working_status === 'ASSIGNED' ? 'bg-blue-400' :
                            staff.working_status === 'ON_BREAK' ? 'bg-amber-400' : 'bg-slate-400'
                          }`} />
                          {staff.working_status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-300 max-w-xs truncate">
                        {staff.current_task ? (
                          <span className="text-slate-200 font-mono">{staff.current_task}</span>
                        ) : (
                          <span className="text-slate-500 italic">Standby / Unassigned</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs font-mono font-medium text-slate-200">
                        {staff.tasks_completed_today}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${Math.min(staff.efficiency_score, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-emerald-400">
                            {staff.efficiency_score}%
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleEditClick(staff)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Update</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Update Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/70 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Update Roster: {editingStaff.user?.name}
              </h3>
              <button
                onClick={() => setEditingStaff(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Working Status</label>
                <select
                  value={editForm.working_status}
                  onChange={(e) => setEditForm({ ...editForm, working_status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="ON_DUTY">ON DUTY (Available)</option>
                  <option value="ASSIGNED">ASSIGNED (Active in Bay)</option>
                  <option value="ON_BREAK">ON BREAK</option>
                  <option value="OFF_DUTY">OFF DUTY</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Shift</label>
                <select
                  value={editForm.shift}
                  onChange={(e) => setEditForm({ ...editForm, shift: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="MORNING">MORNING (06:00 - 14:00)</option>
                  <option value="EVENING">EVENING (14:00 - 22:00)</option>
                  <option value="NIGHT">NIGHT (22:00 - 06:00)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Assign Task Description</label>
                <input
                  type="text"
                  placeholder="e.g. Bay 2 sanitize TS-09-EV-1002"
                  value={editForm.current_task}
                  onChange={(e) => setEditForm({ ...editForm, current_task: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateStaffMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {updateStaffMutation.isPending ? 'Saving...' : 'Update Staff Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPage;
