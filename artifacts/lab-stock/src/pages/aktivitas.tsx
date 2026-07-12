import { useState } from "react";
import {
  useListTransactions,
  useDeleteTransaction,
  getListTransactionsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Constants ────────────────────────────────────────────────────────────────

const SHIFT_COLORS: Record<string, string> = {
  "Shift 1": "bg-blue-50 text-blue-700 border-blue-200",
  "Shift 2": "bg-violet-50 text-violet-700 border-violet-200",
  "Shift 3": "bg-orange-50 text-orange-700 border-orange-200",
};

const MONTHS = [
  { value: 1,  label: "Januari"   },
  { value: 2,  label: "Februari"  },
  { value: 3,  label: "Maret"     },
  { value: 4,  label: "April"     },
  { value: 5,  label: "Mei"       },
  { value: 6,  label: "Juni"      },
  { value: 7,  label: "Juli"      },
  { value: 8,  label: "Agustus"   },
  { value: 9,  label: "September" },
  { value: 10, label: "Oktober"   },
  { value: 11, label: "November"  },
  { value: 12, label: "Desember"  },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Baca query param dari URL saat komponen di-mount (wouter-safe). */
function getInitialParam(key: string): string | null {
  try {
    return new URLSearchParams(window.location.search).get(key);
  } catch {
    return null;
  }
}

/** Hitung tanggal awal dan akhir bulan. */
function monthDateRange(year: number, month: number): { dateFrom: string; dateTo: string } {
  const lastDay = new Date(year, month, 0).getDate(); // month 1-indexed → new Date(y, m, 0)
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    dateFrom: `${year}-${pad(month)}-01`,
    dateTo:   `${year}-${pad(month)}-${lastDay}`,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Aktivitas() {
  // Baca filter awal dari URL (mis. dari klik kartu dashboard)
  const [typeFilter,  setTypeFilter ] = useState<string>(() => getInitialParam("type")  ?? "ALL");
  const [shiftFilter, setShiftFilter] = useState<string>("ALL");
  const [month,       setMonth      ] = useState<string>("0");   // "0" = semua bulan
  const [year,        setYear       ] = useState<string>(String(CURRENT_YEAR));

  const queryClient = useQueryClient();
  const { toast }   = useToast();

  // Hitung rentang tanggal hanya jika bulan dipilih
  const monthNum = parseInt(month, 10);
  const yearNum  = parseInt(year, 10);
  const dateRange = monthNum > 0 ? monthDateRange(yearNum, monthNum) : undefined;

  const { data: transactions, isLoading } = useListTransactions({
    type:     typeFilter === "ALL" ? undefined : typeFilter as "IN" | "OUT",
    dateFrom: dateRange?.dateFrom,
    dateTo:   dateRange?.dateTo,
    limit:    500, // ambil lebih banyak agar filter shift sisi-client akurat
  });

  const deleteTx = useDeleteTransaction();

  const handleDelete = (id: number) => {
    if (!confirm("Hapus catatan aktivitas ini? Stok akan disesuaikan kembali.")) return;
    deleteTx.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Aktivitas dihapus" });
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
      },
      onError: () => {
        toast({ title: "Gagal menghapus aktivitas", variant: "destructive" });
      },
    });
  };

  // Filter shift dilakukan di sisi client
  const filtered = transactions?.filter(
    (tx) => shiftFilter === "ALL" || tx.shift === shiftFilter,
  );

  const hasDateFilter = monthNum > 0;
  const activeDateLabel = hasDateFilter
    ? `${MONTHS[monthNum - 1].label} ${year}`
    : null;

  const clearDateFilter = () => setMonth("0");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Log Aktivitas</h1>
        <p className="text-sm text-muted-foreground">Daftar riwayat barang masuk dan keluar.</p>
      </div>

      <Card>
        <CardHeader className="py-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <CardTitle className="text-lg">Riwayat Aktivitas</CardTitle>

              {/* ── Baris filter ── */}
              <div className="flex flex-wrap items-center gap-2">

                {/* Filter tipe */}
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px] h-9 text-sm">
                    <SelectValue placeholder="Semua Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Tipe</SelectItem>
                    <SelectItem value="IN">Hanya Masuk</SelectItem>
                    <SelectItem value="OUT">Hanya Keluar</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filter shift */}
                <Select value={shiftFilter} onValueChange={setShiftFilter}>
                  <SelectTrigger className="w-[130px] h-9 text-sm">
                    <SelectValue placeholder="Semua Shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Shift</SelectItem>
                    <SelectItem value="Shift 1">Shift 1</SelectItem>
                    <SelectItem value="Shift 2">Shift 2</SelectItem>
                    <SelectItem value="Shift 3">Shift 3</SelectItem>
                  </SelectContent>
                </Select>

                {/* Divider visual */}
                <span className="hidden sm:block h-5 w-px bg-border" />

                {/* Filter bulan */}
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger className="w-[130px] h-9 text-sm">
                    <SelectValue placeholder="Bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Semua Bulan</SelectItem>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={String(m.value)}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Filter tahun (hanya aktif saat bulan dipilih) */}
                <Select
                  value={year}
                  onValueChange={setYear}
                  disabled={monthNum === 0}
                >
                  <SelectTrigger className="w-[100px] h-9 text-sm">
                    <SelectValue placeholder="Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Tombol hapus filter tanggal */}
                {hasDateFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearDateFilter}
                    className="h-9 gap-1 text-muted-foreground hover:text-foreground px-2"
                    title="Hapus filter bulan"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Badge filter aktif */}
            {(activeDateLabel || typeFilter !== "ALL" || shiftFilter !== "ALL") && (
              <div className="flex flex-wrap gap-2 text-xs">
                {activeDateLabel && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 font-medium">
                    📅 {activeDateLabel}
                  </span>
                )}
                {typeFilter !== "ALL" && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium ${
                    typeFilter === "IN"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700"
                  }`}>
                    {typeFilter === "IN" ? "↓ Hanya Masuk" : "↑ Hanya Keluar"}
                  </span>
                )}
                {shiftFilter !== "ALL" && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium ${SHIFT_COLORS[shiftFilter] ?? ""}`}>
                    {shiftFilter}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Tanggal & Waktu</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Barang</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Analis</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : filtered?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      Tidak ada aktivitas ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered?.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm font-medium whitespace-nowrap">
                        {format(new Date(tx.createdAt), "dd MMM yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        {tx.type === "IN" ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            Masuk
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                            Keluar
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{tx.item.name}</div>
                        <div className="text-xs text-muted-foreground">{tx.item.barcode}</div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <span className={tx.type === "IN" ? "text-emerald-600" : "text-rose-600"}>
                          {tx.type === "IN" ? "+" : "-"}{tx.qty}
                        </span>{" "}
                        <span className="text-xs font-normal text-muted-foreground">{tx.item.unit}</span>
                      </TableCell>
                      <TableCell className="text-sm">{tx.analyst.name}</TableCell>
                      <TableCell>
                        {tx.shift ? (
                          <Badge variant="outline" className={SHIFT_COLORS[tx.shift] ?? "bg-gray-50 text-gray-700"}>
                            {tx.shift}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell
                        className="text-sm text-muted-foreground max-w-[180px] truncate"
                        title={tx.notes ?? ""}
                      >
                        {tx.notes || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-rose-600"
                          onClick={() => handleDelete(tx.id)}
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Ringkasan jumlah baris */}
          {!isLoading && filtered && filtered.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3 text-right">
              {filtered.length} catatan ditampilkan
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
