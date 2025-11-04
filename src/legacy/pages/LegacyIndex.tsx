import React from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Archive, ArrowLeft, AlertTriangle } from 'lucide-react'
import { legacyRoutes } from '../constants'

export function LegacyIndex() {
  const location = useLocation()
  const isIndexPage = location.pathname === '/legacy'

  // If we're on a nested route, render the outlet instead
  if (!isIndexPage) {
    return <Outlet />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <Archive className="w-8 h-8 text-amber-600" />
            <h1 className="text-3xl font-bold text-gray-900">Legacy Archive</h1>
          </div>
          
          <p className="text-gray-600">
            This page lists deprecated features that are archived for rollback purposes.
          </p>
        </div>

        {/* Warning Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 mb-1">
              Development Mode Only
            </h3>
            <p className="text-sm text-amber-800">
              Legacy features are only accessible when <code className="bg-amber-100 px-1.5 py-0.5 rounded">VITE_ENABLE_LEGACY=true</code>.
              These features are excluded from production builds and may not be maintained.
            </p>
          </div>
        </div>

        {/* Legacy Routes List */}
        {legacyRoutes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Archive className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Legacy Features
            </h2>
            <p className="text-gray-600">
              There are currently no archived features. When features are deprecated,
              they will appear here for manual verification.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Archived Features ({legacyRoutes.length})
            </h2>
            
            {legacyRoutes.map((route) => (
              <Link
                key={route.path}
                to={`/legacy/${route.path}`}
                className="block bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {route.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">
                      {route.description}
                    </p>
                    {route.deprecatedDate && (
                      <p className="text-xs text-gray-500">
                        Deprecated: {route.deprecatedDate}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Legacy
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Documentation Link */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">
            📚 Documentation
          </h3>
          <p className="text-sm text-blue-800">
            For information about the deprecation policy, how to restore features, or how to
            move features to the legacy archive, see{' '}
            <code className="bg-blue-100 px-1.5 py-0.5 rounded">src/legacy/README.md</code>
          </p>
        </div>
      </div>
    </div>
  )
}
