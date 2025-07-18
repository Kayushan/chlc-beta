import React from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { getPendingLeaveApplicationsForAdmin } from '../lib/leaveManagement';
import { NotificationItem } from '../components/NotificationItem';

export function AllNotifications() {
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('all');

  React.useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      const today = new Date().toLocaleDateString('en-CA');
      // Leave Requests
      const { applications } = await getPendingLeaveApplicationsForAdmin(1, 100);
      // Behavior Reports
      const { data: reports } = await supabase
        .from('behavior_reports')
        .select('*, users(name)')
        .order('created_at', { ascending: false });
      // Attendance Logs
      const { data: attendanceRecords } = await supabase
        .from('attendance_logs')
        .select('*, users(name)')
        .eq('date', today);

      const leaveNotifications = applications.map((app: any) => ({
        id: `leave-${app.id}`,
        type: 'Leave Request',
        message: `Leave request from ${app.users?.name} for ${app.leave_date}`,
        timestamp: new Date(app.created_at).toISOString(),
        data: app,
      }));

      const reportNotifications = (reports || []).map((report: any) => ({
        id: `report-${report.id}`,
        type: 'Behavior Report',
        message: `New behavior report by ${report.users?.name} for ${report.student_name}`,
        timestamp: new Date(report.created_at).toISOString(),
        data: report,
      }));

      const attendanceNotifications = (attendanceRecords || []).map((record: any) => ({
        id: `attendance-${record.id}`,
        type: 'Attendance',
        message: `Teacher ${record.users?.name || record.teacher_id} checked in (${record.status})`,
        timestamp: new Date(record.created_at).toISOString(),
        data: record,
      }));

      const allNotifications = [
        ...leaveNotifications,
        ...reportNotifications,
        ...attendanceNotifications
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setNotifications(allNotifications);
      setLoading(false);
    };
    fetchNotifications();
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    return notification.type === filter;
  });

  return (
    <Layout title="All Notifications">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex justify-center mb-6">
          <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('Leave Request')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === 'Leave Request'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Leave Requests
            </button>
            <button
              onClick={() => setFilter('Behavior Report')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === 'Behavior Report'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Behavior Reports
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No notifications available.
          </p>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map(notification => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
