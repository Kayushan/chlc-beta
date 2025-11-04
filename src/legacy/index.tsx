import React from 'react'
import { Route } from 'react-router-dom'
import { LegacyRoute } from '../components/LegacyRoute'
import { LegacyIndex } from './pages/LegacyIndex'

export function getLegacyRoutes() {
  const isLegacyEnabled = import.meta.env.VITE_ENABLE_LEGACY === 'true'

  if (!isLegacyEnabled) {
    return null
  }

  return (
    <Route
      path="/legacy"
      element={
        <LegacyRoute>
          <LegacyIndex />
        </LegacyRoute>
      }
    >
      {/* Add legacy sub-routes here as features are deprecated */}
      {/* Example:
      <Route
        path="old-feature"
        element={
          <LegacyRoute>
            <OldFeature />
          </LegacyRoute>
        }
      />
      */}
    </Route>
  )
}
