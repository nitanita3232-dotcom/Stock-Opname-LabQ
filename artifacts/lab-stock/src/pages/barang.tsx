import { useState } from "react";
import { 
  useListItems, 
  useCreateItem, 
  useUpdateItem, 
  useDeleteItem,
  getListItemsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";

export default function Barang() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: items, isLoading } = useListItems({
    search: debouncedSearch || undefined
  });
  
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    category: "",
    unit: "",
    minStock: "10",
    description: ""
  });

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({
      name: "",
      barcode: "",
      category: "Reagen",
      unit: "botol",
      minStock: "5",
      description: ""
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      barcode: item.barcode,
      category: item.category,
      unit: item.unit,
      minStock: item.minStock.toString(),
      description: item.description || ""
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      minStock: parseInt(formData.minStock, 10) || 0
    };

    if (editingId) {
      updateItem.mutate({
        id: editingId,
        data: payload
      }, {
        onSuccess: () => {
          toast({ title: "Barang diperbarui" });
          queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
          setIsOpen(false);
        }
      });
    } else {
      createItem.mutate({
        data: payload
      }, {
        onSuccess: () => {
          toast({ title: "Barang ditambahkan" });
          queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
          setIsOpen(false);
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Hapus data barang ini? Aksi ini akan gagal jika barang memiliki riwayat aktivitas.")) return;
    deleteItem.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Barang dihapus" });
        queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
      },
      onError: () => {
        toast({ title: "Gagal menghapus", description: "Barang mungkin memiliki riwayat aktivitas.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Data Barang Master</h1>
          <p className="text-sm text-muted-foreground">Kelola katalog barang, reagen, dan bahan habis pakai.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari barang..."
              className="pl-8 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={handleOpenNew} className="h-9 gap-2">
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama & Barcode</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Min Stok</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Memuat data...</TableCell>
                  </TableRow>
                ) : items?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Tidak ada barang ditemukan</TableCell>
                  </TableRow>
                ) : (
                  items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs font-mono text-muted-foreground">{item.barcode}</div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="font-normal">{item.category}</Badge></TableCell>
                      <TableCell className="text-sm">{item.unit}</TableCell>
                      <TableCell className="text-sm">{item.minStock}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(item)}>
                          <Edit2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-rose-600" />
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Barang" : "Tambah Barang Baru"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Barang</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input id="barcode" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} required className="font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Input id="category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required placeholder="Misal: Reagen" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit">Satuan</Label>
                  <Input id="unit" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} required placeholder="Misal: botol, box" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minStock">Minimal Stok</Label>
                  <Input id="minStock" type="number" min="0" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi (Opsional)</Label>
                <Textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
              <Button type="submit" disabled={createItem.isPending || updateItem.isPending}>
                {createItem.isPending || updateItem.isPending ? "Menyimpan..." : "Simpan Barang"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
