import { describe, expect, it, vi } from 'vitest'

vi.mock('@/layouts/AppLayout', () => ({
  AppLayout: () => null,
}))

vi.mock('@/layouts/AuthLayout', () => ({
  AuthLayout: () => null,
}))

vi.mock('@/shared/components/ui/ErrorBoundary', () => ({
  RouteErrorBoundary: ({ children }: { children: unknown }) => children,
}))

import { router } from './router'

function collectPaths(routes: Array<{ path?: string; index?: boolean; children?: unknown[] }>, prefix = ''): string[] {
  const paths: string[] = []

  for (const route of routes) {
    const current = route.index ? `${prefix}(index)` : `${prefix}${route.path ?? ''}`
    paths.push(current)
    if (route.children) {
      paths.push(...collectPaths(route.children as Array<{ path?: string; index?: boolean; children?: unknown[] }>, `${current} > `))
    }
  }

  return paths
}

describe('router', () => {
  it('includes the expected top-level routes', () => {
    const paths = collectPaths(router.routes as Array<{ path?: string; index?: boolean; children?: unknown[] }>)

    expect(paths.some((path) => path.includes('/login'))).toBe(true)
    expect(paths.some((path) => path.includes('/signup'))).toBe(true)
    expect(paths.some((path) => path.includes('/onboarding'))).toBe(true)
    expect(paths.some((path) => path.includes('/dashboard'))).toBe(true)
    expect(paths.some((path) => path.includes('/403'))).toBe(true)
    expect(paths.some((path) => path.includes('*'))).toBe(true)
  })

  it('redirects the root route to dashboard', () => {
    const routes = router.routes as Array<{
      children?: Array<{
        children?: Array<{
          index?: boolean
          path?: string
          element?: unknown
        }>
      }>
    }>

    const appRoutes = routes[2]?.children?.[0]?.children ?? []
    const rootIndex = appRoutes.find((route) => route.index)

    expect(rootIndex).toBeTruthy()
  })
})