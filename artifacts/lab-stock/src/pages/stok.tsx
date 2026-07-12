import { useState } from "react";
import { useListStock } from "@workspace/api-client-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { useDebounce } from "@/hooks/use-debounce";

/** Baca query param dari URL saat komponen di-mount. */
function getInitialBool(key: string): boolean {
  try {
    return new URLSearchParams(window.location.search).get(key) === "true";
  } catch {
    return false;
  }
}

export default function Stok() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // Inisialisasi dari URL: kartu "Stok Menipis" di dashboard kirim ?lowStock=true
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(() => getInitialBool("lowStock"));

  const { data: stocks, isLoading } = useListStock({
    search:   debouncedSearch || undefined,
    lowStock: lowStockOnly || undefined,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ringkasan Stok</h1>
        <p className="text-sm text-muted-foreground">
          Pantau sisa stok dan riwayat pergerakan semua barang.
        </p>
      </div>

      <Card>
        <CardHeader className="py-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Daftar Stok Barang</CardTitle>
              {lowStockOnly && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-normal">
                  ⚠ Menipis saja
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="low-stock"
                  checked={lowStockOnly}
                  onCheckedChange={(checked) => setLowStockOnly(!!checked)}
                />
                <label
                  htmlFor="low-stock"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Hanya Stok Menipis
                </label>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama atau barcode..."
                  className="pl-8 h-9 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barang</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Total Masuk</TableHead>
                  <TableHead className="text-right">Total Keluar</TableHead>
                  <TableHead className="text-right">Sisa Stok</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Update Terakhir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : stocks?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      {lowStockOnly ? "Tidak ada barang dengan stok menipis 👍" : "Tidak ada data stok ditemukan"}
                    </TableCell>
                  </TableRow>
                ) : (
                  stocks?.map((stock) => (
                    <TableRow key={stock.item.id}>
                      <TableCell>
                        <div className="font-medium text-sm text-foreground">{stock.item.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{stock.item.barcode}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">{stock.item.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium">
                        {stock.totalIn}
                      </TableCell>
                      <TableCell className="text-right text-rose-600 font-medium">
                        {stock.totalOut}
                      </TableCell>
                      <TableCell className="text-right font-bold text-base">
                        {stock.currentStock}{" "}
                        <span className="text-xs text-muted-foreground font-normal">{stock.item.unit}</span>
                      </TableCell>
                      <TableCell>
                        {stock.isLowStock ? (
                          <Badge variant="destructive" className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none">
                            Menipis (Min: {stock.item.minStock})
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            Aman
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {stock.lastTransactionAt
                          ? format(new Date(stock.lastTransactionAt), "dd MMM yyyy HH:mm")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {!isLoading && stocks && stocks.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3 text-right">
              {stocks.length} barang ditampilkan
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
