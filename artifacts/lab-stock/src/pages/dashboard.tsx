import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, ArrowDownToLine, ArrowUpToLine, Users, AlertTriangle, Activity, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

const SHIFT_COLORS: Record<string, string> = {
  "Shift 1": "bg-blue-50 text-blue-700 border-blue-200",
  "Shift 2": "bg-violet-50 text-violet-700 border-violet-200",
  "Shift 3": "bg-orange-50 text-orange-700 border-orange-200",
};

function KpiCard({
  title,
  value,
  icon: Icon,
  iconClass = "text-muted-foreground",
  valueClass = "",
  href,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  iconClass?: string;
  valueClass?: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="group cursor-pointer transition-all duration-150 hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
          <div className="flex items-center gap-1">
            <Icon className={`h-4 w-4 ${iconClass}`} />
            <ExternalLink className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-opacity" />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
          <p className="text-xs text-muted-foreground/0 group-hover:text-muted-foreground transition-colors mt-0.5">
            Lihat detail →
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary();

  if (isLoading) {
    return <div className="text-sm text-muted-foreground animate-pulse">Memuat dashboard...</div>;
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Ringkasan pergerakan stok hari ini.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard title="Total Barang"       value={summary.totalItems}             icon={Package}         href="/barang"    />
        <KpiCard title="Aktivitas Hari Ini" value={summary.totalTransactionsToday} icon={Activity}        href="/aktivitas" />
        <KpiCard title="Masuk Hari Ini"     value={summary.totalInToday}           icon={ArrowDownToLine} iconClass="text-emerald-600" href="/aktivitas" />
        <KpiCard title="Keluar Hari Ini"    value={summary.totalOutToday}          icon={ArrowUpToLine}   iconClass="text-rose-600"    href="/aktivitas" />
        <KpiCard title="Stok Menipis"       value={summary.lowStockCount}          icon={AlertTriangle}   iconClass="text-amber-500" valueClass="text-amber-600" href="/stok" />
        <KpiCard title="Analis Aktif"       value={summary.totalAnalysts}          icon={Users}           href="/analis"    />
      </div>

      {/* Tabel aktivitas terakhir */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Aktivitas Terakhir</CardTitle>
          <Link href="/aktivitas" className="text-xs text-primary hover:underline flex items-center gap-1">
            Lihat semua <ExternalLink className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Waktu</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Barang</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Analis</TableHead>
                  <TableHead>Shift</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.recentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                      Belum ada aktivitas
                    </TableCell>
                  </TableRow>
                ) : (
                  summary.recentTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                        {format(new Date(tx.createdAt), "dd MMM yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        {tx.type === "IN" ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Masuk</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">Keluar</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{tx.item.name}</div>
                        <div className="text-xs text-muted-foreground">{tx.item.barcode}</div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {tx.type === "IN" ? "+" : "-"}{tx.qty} {tx.item.unit}
                      </TableCell>
                      <TableCell className="text-sm">{tx.analyst.name}</TableCell>
                      <TableCell>
                        {tx.shift ? (
                          <Badge variant="outline" className={SHIFT_COLORS[tx.shift] ?? ""}>
                            {tx.shift}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
