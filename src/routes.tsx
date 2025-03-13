import {createHashRouter, Navigate, Outlet} from "react-router-dom";
import {lazy} from "react";

export const createRouter = () => {
    const App = lazy(() => import('./pages/app'))
    const Auth = lazy(() => import('./pages/auth'))
    const LocalAuth = lazy(() => import('./pages/local-auth'))

    return createHashRouter([
        {
            path: '/',
            element: <Outlet />,
            children: [
                {
                    path: '/app',
                    element: <App />
                },
                {
                    path: '/auth',
                    element: <Auth />
                },
                {
                    path: '/local-auth',
                    element: <LocalAuth />
                },
                {
                    path: '/',
                    element: <Navigate to={'/app'} />
                },
                {
                    path: '*',
                    element: <Navigate to={'/app'} />
                },
            ]
        }
    ])
}
