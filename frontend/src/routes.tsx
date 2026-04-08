import type { RouteRecord } from 'vite-react-ssg'
import { AppLayout } from './components/Layout'

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        lazy: () => import('./pages/Home').then((m) => ({ Component: m.HomePage })),
      },
      {
        path: 'encyclopedia',
        lazy: () => import('./pages/Encyclopedia').then((m) => ({ Component: m.EncyclopediaPage })),
      },
      {
        path: 'sweet-16',
        lazy: () => import('./pages/Sweet16').then((m) => ({ Component: m.Sweet16Page })),
      },
      {
        path: 'miss-basketball',
        lazy: () => import('./pages/MissBasketball').then((m) => ({ Component: m.MissBasketballPage })),
      },
      {
        path: 'mister-basketball',
        lazy: () => import('./pages/MisterBasketball').then((m) => ({ Component: m.MisterBasketballPage })),
      },
      {
        path: 'records',
        lazy: () => import('./pages/Records').then((m) => ({ Component: m.RecordsPage })),
      },
      {
        path: 'hall-of-fame',
        lazy: () => import('./pages/HallOfFame').then((m) => ({ Component: m.HallOfFamePage })),
      },
      {
        path: 'all-a-classic',
        lazy: () => import('./pages/AllAClassic').then((m) => ({ Component: m.AllAClassicPage })),
      },
    ],
  },
]
