export interface LegacyRouteInfo {
  path: string
  title: string
  description: string
  deprecatedDate?: string
}

export const legacyRoutes: LegacyRouteInfo[] = [
  // Add legacy routes here as features are deprecated
  // Example:
  // {
  //   path: 'old-feature',
  //   title: 'Old Feature',
  //   description: 'The original feature before redesign',
  //   deprecatedDate: '2024-01-15'
  // }
]
