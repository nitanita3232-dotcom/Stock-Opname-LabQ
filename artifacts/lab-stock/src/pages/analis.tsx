import { useState } from "react";
import { 
  useListAnalysts, 
  useCreateAnalyst, 
  useUpdateAnalyst, 
  useDeleteAnalyst,
  getListAnalystsQueryKey
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Analis() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: analysts, isLoading } = useListAnalysts();
  
  const createAnalyst = useCreateAnalyst();
  const updateAnalyst = useUpdateAnalyst();
  const deleteAnalyst = useDeleteAnalyst();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("Analis");

  const handleOpenNew = () => {
    setEditingId(null);
    setName("");
    setRole("Analis");
    setIsOpen(true);
  };

  const handleOpenEdit = (analyst: any) => {
    setEditingId(analyst.id);
    setName(analyst.name);
    setRole(analyst.role);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;

    if (editingId) {
      updateAnalyst.mutate({
        id: editingId,
        data: { name, role }
      }, {
        onSuccess: () => {
          toast({ title: "Analis diperbarui" });
          queryClient.invalidateQueries({ queryKey: getListAnalystsQueryKey() });
          setIsOpen(false);
        }
      });
    } else {
      createAnalyst.mutate({
        data: { name, role }
      }, {
        onSuccess: () => {
          toast({ title: "Analis ditambahkan" });
          queryClient.invalidateQueries({ queryKey: getListAnalystsQueryKey() });
          setIsOpen(false);
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Hapus data analis ini?")) return;
    deleteAnalyst.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Analis dihapus" });
        queryClient.invalidateQueries({ queryKey: getListAnalystsQueryKey() });
      },
      onError: () => {
        toast({ title: "Gagal menghapus", description: "Pastikan analis tidak memiliki riwayat aktivitas.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Data Analis</h1>
          <p className="text-sm text-muted-foreground">Kelola daftar analis laboratorium.</p>
        </div>
        <Button onClick={handleOpenNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Tambah Analis
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Tanggal Terdaftar</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Memuat data...</TableCell>
                </TableRow>
              ) : analysts?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Belum ada data analis</TableCell>
                </TableRow>
              ) : (
                analysts?.map((analyst) => (
                  <TableRow key={analyst.id}>
                    <TableCell className="font-medium">{analyst.name}</TableCell>
                    <TableCell>{analyst.role}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(analyst.createdAt), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(analyst)}>
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(analyst.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-rose-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Analis" : "Tambah Analis Baru"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Peran / Jabatan</Label>
                <Input id="role" value={role} onChange={e => setRole(e.target.value)} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
              <Button type="submit" disabled={createAnalyst.isPending || updateAnalyst.isPending}>
                {createAnalyst.isPending || updateAnalyst.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
