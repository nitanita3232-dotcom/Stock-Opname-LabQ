import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter, Redirect } from 'wouter';
import { Layout } from '@/components/layout/Layout';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy-load every page so the initial JS bundle is minimal.
// Each page becomes its own Rollup chunk (split in vite.config.ts).
const Dashboard = lazy(() => import('@/pages/dashboard'));
const Aktivitas  = lazy(() => import('@/pages/aktivitas'));
const Scan       = lazy(() => import('@/pages/scan'));
const Stok       = lazy(() => import('@/pages/stok'));
const Barang     = lazy(() => import('@/pages/barang'));
const Analis     = lazy(() => import('@/pages/analis'));
const NotFound   = lazy(() => import('@/pages/not-found'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Keep data fresh for 30 s — reduces redundant network trips when
      // navigating between pages.
      staleTime: 30_000,
    },
  },
});

/** Skeleton shown while a lazy page chunk is loading. */
function PageFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Suspense fallback={<PageFallback />}>
        <Switch>
          <Route path="/">
            <Redirect to="/dashboard" />
          </Route>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/aktivitas"  component={Aktivitas}  />
          <Route path="/scan"       component={Scan}       />
          <Route path="/stok"       component={Stok}       />
          <Route path="/barang"     component={Barang}     />
          <Route path="/analis"     component={Analis}     />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}

function App() {
  // import.meta.env.BASE_URL is '/' on Vercel (base: '/' in vite.config.ts)
  // and '/lab-stock/' on Replit (BASE_PATH env var).  Stripping the trailing
  // slash gives wouter the correct base for both environments.
  const routerBase = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={routerBase}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
