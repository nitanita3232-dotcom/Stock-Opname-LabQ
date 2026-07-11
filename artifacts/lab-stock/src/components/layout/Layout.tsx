import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard,
  ArrowLeftRight,
  ScanLine,
  Database,
  Package,
  Users,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLLAPSE_KEY = 'sidebar-collapsed';

const NAV_ITEMS = [
  { name: 'Dashboard',    href: '/dashboard', icon: LayoutDashboard },
  { name: 'Scan QR Code', href: '/scan',      icon: ScanLine        },
  { name: 'Aktivitas',    href: '/aktivitas', icon: ArrowLeftRight   },
  { name: 'Stok',         href: '/stok',      icon: Database         },
  { name: 'Data Barang',  href: '/barang',    icon: Package          },
  { name: 'Analis',       href: '/analis',    icon: Users            },
];

// ─── Context ──────────────────────────────────────────────────────────────────

type SidebarCtx = {
  collapsed:    boolean;
  mobileOpen:   boolean;
  toggleCollapse: () => void;
  openMobile:   () => void;
  closeMobile:  () => void;
};

const SidebarContext = createContext<SidebarCtx>({
  collapsed:    false,
  mobileOpen:   false,
  toggleCollapse: () => {},
  openMobile:   () => {},
  closeMobile:  () => {},
});

// ─── Shared nav content (used in both desktop and mobile drawers) ─────────────

function NavContent({
  collapsed,
  onLinkClick,
}: {
  collapsed: boolean;
  onLinkClick?: () => void;
}) {
  const [location] = useLocation();

  return (
    <nav className="grid gap-1 px-2 py-4">
      {NAV_ITEMS.map(({ name, href, icon: Icon }) => {
        const active =
          location === href ||
          (location === '/' && href === '/dashboard');

        return (
          <Link
            key={href}
            href={href}
            onClick={onLinkClick}
            title={collapsed ? name : undefined}
            aria-label={name}
            className={[
              'flex items-center gap-3 rounded-md text-sm font-medium transition-colors',
              collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2',
              active
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent hover:text-accent-foreground text-foreground/80',
            ].join(' ')}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>{name}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Desktop sidebar ──────────────────────────────────────────────────────────

function DesktopSidebar() {
  const { collapsed, toggleCollapse } = useContext(SidebarContext);

  return (
    <aside
      className={[
        'relative hidden md:flex flex-col flex-shrink-0',
        'border-r bg-card text-card-foreground',
        'transition-[width] duration-300 ease-in-out overflow-visible',
        collapsed ? 'w-14' : 'w-64',
      ].join(' ')}
    >
      {/* Logo row */}
      <div
        className={[
          'flex h-14 items-center border-b flex-shrink-0',
          collapsed ? 'justify-center px-0' : 'px-4 gap-2',
        ].join(' ')}
      >
        <Database className="h-5 w-5 text-primary flex-shrink-0" />
        {!collapsed && (
          <span className="font-semibold tracking-tight text-primary text-sm truncate">
            Stock Opname Lab
          </span>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <NavContent collapsed={collapsed} />
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground">&copy; 2024 Lab Systems</p>
        </div>
      )}

      {/* Collapse toggle — floats on the right edge */}
      <button
        onClick={toggleCollapse}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={[
          'absolute -right-3 top-[3.25rem] z-10',
          'flex h-6 w-6 items-center justify-center rounded-full',
          'border bg-background shadow-md',
          'hover:bg-accent transition-colors',
        ].join(' ')}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  );
}

// ─── Mobile sidebar (drawer + backdrop) ───────────────────────────────────────

function MobileSidebar() {
  const { mobileOpen, closeMobile } = useContext(SidebarContext);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={closeMobile}
        className={[
          'fixed inset-0 z-40 bg-black/50 md:hidden',
          'transition-opacity duration-300',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />

      {/* Drawer */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 w-72 flex flex-col',
          'bg-card text-card-foreground border-r shadow-xl md:hidden',
          'transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Mobile header */}
        <div className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="font-semibold tracking-tight text-primary text-sm">
              Stock Opname Lab
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={closeMobile} className="h-8 w-8">
            <X className="h-4 w-4" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto">
          <NavContent collapsed={false} onLinkClick={closeMobile} />
        </div>

        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground">&copy; 2024 Lab Systems</p>
        </div>
      </aside>
    </>
  );
}

// ─── Top bar shown only on mobile ─────────────────────────────────────────────

function MobileTopBar() {
  const { openMobile } = useContext(SidebarContext);

  return (
    <header className="flex h-14 flex-shrink-0 items-center border-b bg-card px-4 md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={openMobile}
        aria-label="Open menu"
        className="mr-3"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-primary" />
        <span className="font-semibold text-primary text-sm">Stock Opname Lab</span>
      </div>
    </header>
  );
}

// ─── Root layout ──────────────────────────────────────────────────────────────

export function Layout({ children }: { children: React.ReactNode }) {
  // Read persisted collapse state from localStorage (desktop only).
  const [collapsed, setCollapsedState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsedState(next);
    try {
      localStorage.setItem(COLLAPSE_KEY, String(next));
    } catch { /* storage unavailable */ }
  };

  // Close mobile drawer whenever the route changes.
  const [location] = useLocation();
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Prevent body scroll while mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        mobileOpen,
        toggleCollapse,
        openMobile:  () => setMobileOpen(true),
        closeMobile: () => setMobileOpen(false),
      }}
    >
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop sidebar */}
        <DesktopSidebar />

        {/* Mobile drawer + backdrop */}
        <MobileSidebar />

        {/* Content area */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          {/* Top bar (mobile only) */}
          <MobileTopBar />

          <main className="flex-1 overflow-y-auto">
            <div className="p-5 md:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}

// Re-export Sidebar for backward compat (no consumers in current code, but safe to keep).
export function Sidebar() {
  return <DesktopSidebar />;
}
