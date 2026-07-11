import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, Redirect } from 'wouter';

import { Layout } from "@/components/layout/Layout";
import Dashboard from "@/pages/dashboard";
import Aktivitas from "@/pages/aktivitas";
import Scan from "@/pages/scan";
import Stok from "@/pages/stok";
import Barang from "@/pages/barang";
import Analis from "@/pages/analis";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    }
  }
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/">
          <Redirect to="/dashboard" />
        </Route>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/aktivitas" component={Aktivitas} />
        <Route path="/scan" component={Scan} />
        <Route path="/stok" component={Stok} />
        <Route path="/barang" component={Barang} />
        <Route path="/analis" component={Analis} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
