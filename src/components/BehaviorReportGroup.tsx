import React, { useState } from 'react';
import { BehaviorReportCard, BehaviorReportCardProps } from './BehaviorReportCard';

export interface BehaviorReportGroupProps {
  label: string;
  reports: BehaviorReportCardProps['report'][];
}

export const BehaviorReportGroup: React.FC<BehaviorReportGroupProps> = ({ label, reports }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="mb-6">
      <button
        className="w-full flex justify-between items-center bg-purple-100 dark:bg-purple-900 rounded-lg px-4 py-2 font-semibold text-purple-800 dark:text-purple-200 mb-2"
        onClick={() => setCollapsed(!collapsed)}
        aria-expanded={!collapsed}
      >
        <span>{label}</span>
        <span>{collapsed ? '+' : '-'}</span>
      </button>
      {!collapsed && (
        <div className="space-y-2">
          {reports.map(report => (
            <BehaviorReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
};
