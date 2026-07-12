import { useState } from "react";
import { useListTransactions, useDeleteTransaction, getListTransactionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SHIFT_COLORS: Record<string, string> = {
  "Shift 1": "bg-blue-50 text-blue-700 border-blue-200",
  "Shift 2": "bg-violet-50 text-violet-700 border-violet-200",
  "Shift 3": "bg-orange-50 text-orange-700 border-orange-200",
};

export default function Aktivitas() {
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [shiftFilter, setShiftFilter] = useState<string>("ALL");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: transactions, isLoading } = useListTransactions({
    type: typeFilter === "ALL" ? undefined : typeFilter as "IN" | "OUT",
    limit: 100
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
      }
    });
  };

  // Filter shift di sisi client (API tidak punya filter shift)
  const filtered = transactions?.filter((tx) =>
    shiftFilter === "ALL" || tx.shift === shiftFilter
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Log Aktivitas</h1>
        <p className="text-sm text-muted-foreground">Daftar riwayat barang masuk dan keluar.</p>
      </div>

      <Card>
        <CardHeader className="py-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <CardTitle className="text-lg">Riwayat Aktivitas</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
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
            </div>
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
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Memuat data...</TableCell>
                  </TableRow>
                ) : filtered?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Tidak ada aktivitas ditemukan</TableCell>
                  </TableRow>
                ) : (
                  filtered?.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm font-medium whitespace-nowrap">
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
                      <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate" title={tx.notes ?? ""}>
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
        </CardContent>
      </Card>
    </div>
  );
}
