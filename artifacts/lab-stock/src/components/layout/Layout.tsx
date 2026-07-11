import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  ScanLine, 
  Database, 
  Package, 
  Users 
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Scan QR Code", href: "/scan", icon: ScanLine },
    { name: "Aktivitas", href: "/aktivitas", icon: ArrowLeftRight },
    { name: "Stok", href: "/stok", icon: Database },
    { name: "Data Barang", href: "/barang", icon: Package },
    { name: "Analis", href: "/analis", icon: Users },
  ];

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card text-card-foreground">
      <div className="flex h-14 items-center border-b px-4">
        <Database className="mr-2 h-5 w-5 text-primary" />
        <span className="font-semibold tracking-tight text-primary">Stock Opname Lab</span>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          {navItems.map((item) => {
            const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
            return (
              <Link key={item.name} href={item.href} className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground"}`} data-testid={`nav-${item.name.toLowerCase().replace(" ", "-")}`}>
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          &copy; 2024 Lab Systems
        </div>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
