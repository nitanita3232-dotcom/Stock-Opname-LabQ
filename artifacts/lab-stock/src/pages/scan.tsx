import { useState, useRef, useEffect } from "react";
import { 
  useGetItemByBarcode, 
  useGetItemStock,
  useListAnalysts, 
  useCreateTransaction,
  getGetDashboardSummaryQueryKey,
  getListStockQueryKey,
  getListTransactionsQueryKey,
  getGetItemStockQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, ScanLine, CheckCircle2, Package } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function Scan() {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [analystId, setAnalystId] = useState<string>("");
  const [type, setType] = useState<"IN" | "OUT">("OUT");
  const [qty, setQty] = useState<string>("1");
  const [notes, setNotes] = useState("");
  
  const barcodeRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: item, error: itemError, isLoading: isItemLoading } = useGetItemByBarcode(scannedBarcode, {
    query: {
      enabled: !!scannedBarcode,
    }
  });

  const { data: itemStock } = useGetItemStock(item?.id as number, {
    query: {
      enabled: !!item?.id,
    }
  });

  const { data: analysts } = useListAnalysts();

  const createTransaction = useCreateTransaction();

  // Focus barcode input on mount
  useEffect(() => {
    barcodeRef.current?.focus();
  }, []);

  const handleBarcodeSubmit = (e: React.FormEvent | React.FocusEvent) => {
    e.preventDefault();
    if (barcodeInput.trim() && barcodeInput.trim() !== scannedBarcode) {
      setScannedBarcode(barcodeInput.trim());
      setQty("1");
      setNotes("");
    }
  };

  const handleTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    if (!analystId) {
      toast({ title: "Pilih analis", variant: "destructive" });
      return;
    }
    const numQty = parseInt(qty, 10);
    if (isNaN(numQty) || numQty <= 0) {
      toast({ title: "Kuantitas tidak valid", variant: "destructive" });
      return;
    }

    createTransaction.mutate({
      data: {
        itemId: item.id,
        analystId: parseInt(analystId, 10),
        type,
        qty: numQty,
        notes
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Aktivitas Berhasil",
          description: `${type === "IN" ? "Masuk" : "Keluar"} ${numQty} ${item.unit} ${item.name}`,
        });
        
        // Invalidate caches
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListStockQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetItemStockQueryKey(item.id) });
        
        // Reset form
        setBarcodeInput("");
        setScannedBarcode("");
        setQty("1");
        setNotes("");
        setType("OUT");
        barcodeRef.current?.focus();
      },
      onError: () => {
        toast({ title: "Gagal menyimpan aktivitas", variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Scan Barcode</h1>
        <p className="text-sm text-muted-foreground">Pindai barcode barang untuk mencatat stok masuk/keluar.</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium">Input Barcode</CardTitle>
          <CardDescription>Gunakan scanner atau ketik manual lalu tekan Enter</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <ScanLine className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                ref={barcodeRef}
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onBlur={handleBarcodeSubmit}
                placeholder="Scan barcode..."
                className="pl-9 font-mono bg-slate-50"
                autoFocus
                data-testid="input-barcode"
              />
            </div>
            <Button type="submit" variant="secondary" data-testid="button-scan-submit">Cari</Button>
          </form>
        </CardContent>
      </Card>

      {isItemLoading && (
        <div className="text-center py-8 text-sm text-muted-foreground animate-pulse">
          Mencari barang...
        </div>
      )}

      {itemError && scannedBarcode && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Barang tidak ditemukan</AlertTitle>
          <AlertDescription>
            Tidak ada barang dengan barcode <strong>{scannedBarcode}</strong> dalam database.
          </AlertDescription>
        </Alert>
      )}

      {item && (
        <Card className="border-primary/20 shadow-sm">
          <CardHeader className="bg-primary/5 pb-4 border-b">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg text-primary flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  {item.name}
                </CardTitle>
                <div className="text-sm text-muted-foreground mt-1 font-mono">{item.barcode} • {item.category}</div>
              </div>
              {itemStock && (
                <div className="text-right">
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1 justify-end">
                    <Package className="h-3.5 w-3.5" />
                    Stok Saat Ini
                  </div>
                  <Badge variant={itemStock.isLowStock ? "destructive" : "secondary"} className="text-sm">
                    {itemStock.currentStock} {item.unit}
                  </Badge>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleTransactionSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipe Aktivitas</Label>
                  <RadioGroup 
                    value={type} 
                    onValueChange={(val) => setType(val as "IN" | "OUT")}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2 border rounded-md px-3 py-2 flex-1 cursor-pointer hover:bg-slate-50">
                      <RadioGroupItem value="IN" id="type-in" data-testid="radio-in" />
                      <Label htmlFor="type-in" className="cursor-pointer text-emerald-700 font-medium w-full">Masuk (+)</Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-md px-3 py-2 flex-1 cursor-pointer hover:bg-slate-50">
                      <RadioGroupItem value="OUT" id="type-out" data-testid="radio-out" />
                      <Label htmlFor="type-out" className="cursor-pointer text-rose-700 font-medium w-full">Keluar (-)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qty">Kuantitas ({item.unit})</Label>
                  <Input 
                    id="qty" 
                    type="number" 
                    min="1" 
                    value={qty} 
                    onChange={(e) => setQty(e.target.value)}
                    required
                    data-testid="input-qty"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Analis</Label>
                <Select value={analystId} onValueChange={setAnalystId}>
                  <SelectTrigger data-testid="select-analyst">
                    <SelectValue placeholder="Pilih analis yang bertugas" />
                  </SelectTrigger>
                  <SelectContent>
                    {analysts?.map(a => (
                      <SelectItem key={a.id} value={a.id.toString()}>{a.name} - {a.role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Catatan (Opsional)</Label>
                <Textarea 
                  id="notes" 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Misal: Untuk pengujian sampel batch A"
                  rows={2}
                  data-testid="input-notes"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={createTransaction.isPending}
                data-testid="button-submit-transaction"
              >
                {createTransaction.isPending ? "Menyimpan..." : "Simpan Aktivitas"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
