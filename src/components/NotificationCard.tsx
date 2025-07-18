import React from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  message: string;
  timestamp: string;
  type?: string;
  data?: any;
}

interface NotificationCardProps {
  notifications: Notification[];
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ notifications }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
          New Notifications
        </h3>
      </div>
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No new notifications.</p>
        ) : (
          notifications.map((notification) => {
            // Attendance notification detection: id starts with 'attendance-' or notification.type === 'Attendance'
            const isAttendance = notification.id?.startsWith('attendance-') || notification.type === 'Attendance';
            if (isAttendance) {
              return (
                <div key={notification.id} className="flex items-start gap-4">
                  <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-full">
                    <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-800 dark:text-white font-semibold">Attendance Check-In</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{notification.timestamp}</p>
                    {/* Show details if available */}
                    {notification.data ? (
                      <>
                        <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-semibold">Teacher:</span> {notification.data.users?.name || notification.data.teacher_id}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-semibold">Status:</span> {notification.data.status}</p>
                        {notification.data.remarks && (
                          <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-semibold">Remarks:</span> {notification.data.remarks}</p>
                        )}
                        <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-semibold">Check-In Time:</span> {new Date(notification.data.created_at).toLocaleTimeString()}</p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-700 dark:text-gray-300">{notification.message}</p>
                    )}
                  </div>
                </div>
              );
            }
            // Default: other notification types
            return (
              <div key={notification.id} className="flex items-start gap-4">
                <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-full">
                  <Bell size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-gray-800 dark:text-white">{notification.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{notification.timestamp}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
