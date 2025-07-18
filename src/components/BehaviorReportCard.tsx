import React from 'react';

export interface BehaviorReportCardProps {
  report: {
    id: string;
    student_name: string;
    class_level: string;
    incident: string;
    action_taken: string;
    severity?: string;
    teacher_name: string;
    created_at: string;
  };
}

export const BehaviorReportCard: React.FC<BehaviorReportCardProps> = ({ report }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-3 flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="font-semibold text-gray-900 dark:text-white text-base">{report.student_name}</span>
        {report.severity && (
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
            report.severity === 'severe' ? 'bg-red-100 text-red-700' :
            report.severity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'
          }`}>
            {report.severity}
          </span>
        )}
      </div>
      <div className="text-sm text-gray-700 dark:text-gray-300">
        <strong>Incident:</strong> {report.incident}
      </div>
      <div className="text-sm text-gray-700 dark:text-gray-300">
        <strong>Action:</strong> {report.action_taken}
      </div>
      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
        <span>Class: {report.class_level}</span>
        <span>Teacher: {report.teacher_name}</span>
      </div>
      <div className="text-xs text-gray-400 mt-1">{new Date(report.created_at).toLocaleString()}</div>
    </div>
  );
};
