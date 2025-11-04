import React from 'react'
import { Navigate } from 'react-router-dom'

interface LegacyRouteProps {
  children: React.ReactNode
}

export function LegacyRoute({ children }: LegacyRouteProps) {
  const isLegacyEnabled = import.meta.env.VITE_ENABLE_LEGACY === 'true'

  if (!isLegacyEnabled) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
