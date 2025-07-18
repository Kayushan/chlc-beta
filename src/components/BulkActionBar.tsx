import React from 'react';

export interface BulkActionBarProps {
  selectedCount: number;
  onDelete: () => void;
  onClear: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({ selectedCount, onDelete, onClear }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-purple-700 text-white flex items-center justify-between px-4 py-3 shadow-lg sm:static sm:rounded-lg sm:mt-4 sm:mb-2 sm:bg-purple-100 sm:text-purple-900">
      <span className="font-semibold">{selectedCount} selected</span>
      <div className="flex gap-2">
        <button
          className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700"
          onClick={onDelete}
        >
          Delete Selected
        </button>
        <button
          className="px-4 py-2 bg-gray-200 text-purple-900 rounded font-bold hover:bg-gray-300"
          onClick={onClear}
        >
          Clear Selection
        </button>
      </div>
    </div>
  );
};
