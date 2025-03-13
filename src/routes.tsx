import { lazy } from 'react'
import { createHashRouter, Navigate, Outlet } from 'react-router-dom'

export enum RoutePaths {
  Root = '/',
  App = '/app',
  AppLibrary = '/app/library',
  AppMarketplace = '/app/marketplace',
  AppSettings = '/app/settings',

  Auth = '/auth',
  LocalAuth = '/local-auth',
}

export const createRouter = () => {
  const App = lazy(() => import('./pages/app'))

  const AppLibrary = lazy(() => import('@/pages/app/pages/library'))
  const AppMarketplace = lazy(() => import('@/pages/app/pages/marketplace'))
  const AppSettings = lazy(() => import('@/pages/app/pages/settings'))

  const Auth = lazy(() => import('./pages/auth'))
  const LocalAuth = lazy(() => import('./pages/local-auth'))

  return createHashRouter([
    {
      path: RoutePaths.Root,
      element: <Outlet />,
      children: [
        {
          path: RoutePaths.App,
          element: (
            <App>
              <Outlet />
            </App>
          ),
          children: [
            {
              path: RoutePaths.AppLibrary,
              element: <AppLibrary />,
            },
            {
              path: RoutePaths.AppMarketplace,
              element: <AppMarketplace />,
            },
            {
              path: RoutePaths.AppSettings,
              element: <AppSettings />,
            },
            {
              path: RoutePaths.App,
              element: <Navigate to={RoutePaths.AppLibrary} />,
            },
          ],
        },
        {
          path: RoutePaths.Auth,
          element: <Auth />,
        },
        {
          path: RoutePaths.LocalAuth,
          element: <LocalAuth />,
        },

        {
          path: '/',
          element: <Navigate to={RoutePaths.App} />,
        },
        {
          path: '/*',
          element: <Navigate to={RoutePaths.App} />,
        },
      ],
    },
  ])
}
