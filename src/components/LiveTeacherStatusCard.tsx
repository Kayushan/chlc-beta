import React from 'react';
import { CheckCircle, Coffee, XCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

type StatusType = 'present' | 'break' | 'absent' | 'no-checkin';

interface TeacherStatus {
  id: string;
  name: string;
  email: string;
  status: StatusType;
  remarks?: string;
  lastUpdate?: string;
}

export const LiveTeacherStatusCard: React.FC = () => {
  const [teachers, setTeachers] = React.useState<TeacherStatus[]>([]);
  const [filter, setFilter] = React.useState<'all' | StatusType>('all');
  const [sortBy, setSortBy] = React.useState<'name' | 'status'>('name');
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(true);

  // Polling logic
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchData = async () => {
      setLoading(true);
      const { data: users } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'teacher')
        .order('name');
      const today = new Date().toLocaleDateString('en-CA');
      const { data: attendance } = await supabase
        .from('attendance_logs')
        .select('teacher_id, status, remarks, created_at')
        .eq('date', today);
      const teacherList: TeacherStatus[] = (users || []).map((teacher: any) => {
        const todayAttendance = attendance?.find((a: any) => a.teacher_id === teacher.id);
        return {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          status: todayAttendance?.status || 'no-checkin',
          remarks: todayAttendance?.remarks,
          lastUpdate: todayAttendance?.created_at,
        };
      });
      setTeachers(teacherList);
      setLoading(false);
    };
    fetchData();
    interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filtering
  const filtered = filter === 'all' ? teachers : teachers.filter(t => t.status === filter);
  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'status') return a.status.localeCompare(b.status);
    return 0;
  });

  // Status chip rendering
  function StatusChip({ status }: { status: StatusType }) {
    let color = '', icon = null, label = '';
    if (status === 'present') {
      color = 'bg-green-100 text-green-700'; icon = <CheckCircle size={18} className="inline mr-1" />; label = 'Present';
    } else if (status === 'break') {
      color = 'bg-yellow-100 text-yellow-700'; icon = <Coffee size={18} className="inline mr-1" />; label = 'Break';
    } else if (status === 'absent') {
      color = 'bg-red-100 text-red-700'; icon = <XCircle size={18} className="inline mr-1" />; label = 'Absent';
    } else {
      color = 'bg-gray-200 text-gray-600'; icon = <Clock size={18} className="inline mr-1" />; label = 'No Check-in';
    }
    return <span className={`inline-flex items-center px-3 py-1 rounded-full font-semibold text-sm ${color}`}>{icon}{label}</span>;
  }

  // Responsive: detect mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">Live Teacher Status</h3>
        <div className="flex flex-wrap gap-2">
          {['all', 'present', 'break', 'absent', 'no-checkin'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1 rounded-lg text-sm font-semibold border transition-colors ${filter === f ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              aria-label={`Filter ${f}`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <label htmlFor="sortBy" className="sr-only">Sort by</label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-sm"
            aria-label="Sort teachers"
          >
            <option value="name">Sort: Name A-Z</option>
            <option value="status">Sort: Status</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div className="text-gray-400 text-center py-8">Loading...</div>
      ) : isMobile ? (
        <section className="space-y-4">
          {sorted.map(teacher => (
            <article key={teacher.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 shadow flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800 dark:text-white">{teacher.name}</span>
                <StatusChip status={teacher.status} />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Check-in: {teacher.lastUpdate ? new Date(teacher.lastUpdate).toLocaleTimeString() : 'N/A'}</span>
                {teacher.remarks && (
                  <button
                    className="underline text-purple-600 dark:text-purple-400"
                    onClick={() => setExpanded(prev => {
                      const next = new Set(prev);
                      if (next.has(teacher.id)) next.delete(teacher.id); else next.add(teacher.id);
                      return next;
                    })}
                    aria-expanded={expanded.has(teacher.id)}
                  >
                    {expanded.has(teacher.id) ? 'Hide Details' : 'Show Details'}
                  </button>
                )}
              </div>
              {teacher.remarks && expanded.has(teacher.id) && (
                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Remarks:</span> {teacher.remarks}
                </div>
              )}
            </article>
          ))}
        </section>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="pb-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">Teacher</th>
                <th className="pb-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">Email</th>
                <th className="pb-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="pb-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">Check-in Time</th>
                <th className="pb-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sorted.map(teacher => (
                <tr key={teacher.id}>
                  <td className="py-4 font-semibold text-gray-800 dark:text-white text-base">{teacher.name}</td>
                  <td className="py-4 text-sm text-gray-500 dark:text-gray-400">{teacher.email}</td>
                  <td className="py-4"><StatusChip status={teacher.status} /></td>
                  <td className="py-4 text-sm text-gray-500 dark:text-gray-400">{teacher.lastUpdate ? new Date(teacher.lastUpdate).toLocaleTimeString() : 'N/A'}</td>
                  <td className="py-4 text-sm text-gray-700 dark:text-gray-300">{teacher.remarks || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
