import React from 'react';

export interface ReportDeleteModalProps {
  open: boolean;
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ReportDeleteModal: React.FC<ReportDeleteModalProps> = ({ open, count, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h4 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Delete {count} Behavior Report{count > 1 ? 's' : ''}?
        </h4>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Are you sure you want to delete {count} selected report{count > 1 ? 's' : ''}? This action cannot be undone.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className="w-full px-4 py-3 text-base bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="w-full px-4 py-3 text-base bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
            onClick={onConfirm}
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
};
