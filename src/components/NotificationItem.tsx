import React from 'react';
import { FileText, AlertTriangle, CheckCircle } from 'lucide-react';

interface NotificationItemProps {
  notification: any;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  if (notification.type === 'Attendance') {
    return (
      <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-md p-4 flex items-start gap-4">
        <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/50">
          <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">Attendance Check-In</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{notification.timestamp}</p>
          <div>
            <p><span className="font-semibold">Teacher:</span> {notification.data.users?.name || notification.data.teacher_id}</p>
            <p><span className="font-semibold">Status:</span> {notification.data.status}</p>
            {notification.data.remarks && (
              <p><span className="font-semibold">Remarks:</span> {notification.data.remarks}</p>
            )}
            <p><span className="font-semibold">Check-In Time:</span> {new Date(notification.data.created_at).toLocaleTimeString()}</p>
          </div>
        </div>
      </div>
    );
  }

  const isLeaveRequest = notification.type === 'Leave Request';
  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-md p-4 flex items-start gap-4">
      <div className={`p-2 rounded-full ${isLeaveRequest ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-yellow-100 dark:bg-yellow-900/50'}`}> 
        {isLeaveRequest ? (
          <FileText size={20} className="text-blue-600 dark:text-blue-400" />
        ) : (
          <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400" />
        )}
      </div>
      <div className="flex-1">
        <p className="font-semibold">{notification.type}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{notification.timestamp}</p>
        {isLeaveRequest ? (
          <div>
            <p><span className="font-semibold">Teacher:</span> {notification.data.users?.name}</p>
            <p><span className="font-semibold">Date:</span> {notification.data.leave_date}</p>
            <p><span className="font-semibold">Reason:</span> {notification.data.reason}</p>
          </div>
        ) : (
          <div>
            <p><span className="font-semibold">Student:</span> {notification.data.student_name}</p>
            <p><span className="font-semibold">Incident:</span> {notification.data.incident}</p>
          </div>
        )}
      </div>
    </div>
  );
};
